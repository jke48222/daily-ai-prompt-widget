#!/usr/bin/env python3
"""AI Daily Pull fetcher for the Ubersicht widget.

Generates one daily prompt via Anthropic's Messages API using the same key the
WidgetSuite host stores in the Keychain (service
com.jalenedusei.widgetsuite.anthropic), or a plaintext fallback at
~/.config/widgetsuite/anthropic.key.

The result is cached for the day in ~/Library/Caches/ws-aipull.json so the API
is hit at most once per day. Touching ~/Library/Caches/ws-aipull.force makes the
next run fetch a fresh prompt (the widget's "pull again", up to MAX/day). Prints
a single JSON line the widget parses, or an empty line to fall back to the
bundled prompts (no key / offline / error).
"""
import json
import os
import subprocess
import datetime
import urllib.request

CACHE = os.path.expanduser("~/Library/Caches/ws-aipull.json")
FORCE = os.path.expanduser("~/Library/Caches/ws-aipull.force")
KEYFILE = os.path.expanduser("~/.config/widgetsuite/anthropic.key")
PROFILE = os.path.expanduser("~/.config/widgetsuite/profile.txt")
MODEL = "claude-opus-4-7"
MAX = 3
# Categories aligned to the reader's themes (design/creativity, career/learning,
# personal reflection). Shown as the widget's tag and steering the day's prompt.
CATEGORIES = ["design", "creativity", "career", "learning",
              "reflection", "mindset", "craft"]


def today():
    return datetime.date.today().isoformat()


def category_for_today():
    return CATEGORIES[datetime.date.today().weekday() % len(CATEGORIES)]


def read_cache():
    try:
        with open(CACHE) as f:
            return json.load(f)
    except Exception:
        return {}


def write_cache(d):
    try:
        os.makedirs(os.path.dirname(CACHE), exist_ok=True)
        with open(CACHE, "w") as f:
            json.dump(d, f)
    except Exception:
        pass


def get_key():
    # File first (no Keychain prompt). Keychain only as a fallback.
    try:
        with open(KEYFILE) as f:
            k = f.read().strip()
            if k:
                return k
    except Exception:
        pass
    try:
        r = subprocess.run(
            ["security", "find-generic-password", "-s",
             "com.jalenedusei.widgetsuite.anthropic", "-a", "default", "-w"],
            capture_output=True, text=True, timeout=5)
        k = r.stdout.strip()
        if k:
            return k
    except Exception:
        pass
    return ""


def read_profile():
    try:
        with open(PROFILE) as f:
            return f.read().strip()
    except Exception:
        return ""


def system_prompt(category, exclusions, profile):
    lines = [
        "You write one daily prompt that the reader pastes straight into a Claude",
        "conversation to get genuinely useful help. Today's theme is %s." % category,
    ]
    if profile:
        lines.append("")
        lines.append("Tailor it to this reader:")
        lines.append(profile)
        lines.append("")
    lines += [
        "Requirements:",
        "- Address it to Claude as a request or question Claude can act on: explain,",
        "  teach, brainstorm, plan, draft, critique, compare, or design something.",
        "- It must have a clear purpose and lead to something useful. No vague journaling,",
        "  no self-reflection prompts, nothing the reader would just think about alone.",
        "- HARD LIMIT: 150 characters or fewer. Keep it tight and specific.",
        "- Themed around the reader's interests, but practical and concrete.",
        "- No em dashes, no semicolons. Return only the prompt text, no quotes, no preface.",
    ]
    if exclusions:
        lines.append("Do not repeat or paraphrase any of these recent prompts:")
        for p in exclusions[:30]:
            lines.append("- " + p)
    return "\n".join(lines)


def clamp(s, n=150):
    s = (s or "").strip().strip('"').strip()
    if len(s) <= n:
        return s
    cut = s[:n]
    # Prefer ending on a sentence, else on a word boundary.
    for end in ".?!":
        i = cut.rfind(end)
        if i >= n * 0.6:
            return cut[:i + 1]
    sp = cut.rfind(" ")
    return (cut[:sp] if sp > 0 else cut).rstrip(" ,;:")


def fetch(category, key, exclusions, profile):
    body = {
        "model": MODEL,
        "max_tokens": 120,
        "system": system_prompt(category, exclusions, profile),
        "messages": [{"role": "user",
                      "content": "Write today's prompt now. One prompt only, 150 characters max, ready to paste into Claude."}],
    }
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=json.dumps(body).encode("utf-8"),
        headers={"x-api-key": key, "anthropic-version": "2023-06-01",
                 "content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = json.load(resp)
    for b in data.get("content", []):
        if b.get("type") == "text" and b.get("text"):
            return clamp(b["text"].strip())
    raise RuntimeError("no text block")


def emit(d):
    print(json.dumps({"prompt": d.get("prompt"), "category": d.get("category"),
                      "used": d.get("used", 0), "max": MAX, "source": d.get("source", "")}))


def main():
    cache = read_cache()
    force = os.path.exists(FORCE)
    if force:
        try:
            os.remove(FORCE)
        except Exception:
            pass

    fresh_day = cache.get("date") != today()

    # Serve today's cached result for every normal tick. Crucially this is the
    # path taken on the vast majority of refreshes, so we do NOT touch the
    # Keychain (or the network) again until a new day or a forced pull. Even a
    # failed attempt is cached for the day, so a bad key/offline state cannot
    # spam the Keychain prompt.
    if not fresh_day and not force:
        emit(cache)
        return

    used = 0 if fresh_day else cache.get("used", 0)
    if force and not fresh_day:
        if used >= MAX:
            emit(cache)  # out of pulls for today
            return
        used += 1

    key = get_key()
    category = category_for_today()
    recent = cache.get("recent", [])
    profile = read_profile()
    prompt = None
    source = ""
    if key:
        try:
            prompt = fetch(category, key, recent, profile)
            source = "Anthropic / " + MODEL
        except Exception:
            prompt = None

    # Record the attempt for today regardless of outcome, so the next tick hits
    # the cached-serve path above instead of retrying (and re-prompting).
    out = {
        "date": today(),
        "prompt": prompt,
        "category": category,
        "used": used,
        "source": source,
        "recent": ([prompt] + recent)[:30] if prompt else recent,
    }
    write_cache(out)
    emit(out)


main()
