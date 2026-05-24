#!/usr/bin/env python3
"""AI Daily Pull fetcher for the Ubersicht widget.

Generates one daily prompt from a large-language-model API and caches it for the
day in ~/Library/Caches/ws-aipull.json (the API is hit at most once per day).
Touching ~/Library/Caches/ws-aipull.force makes the next run fetch a fresh
prompt (the widget's "pull again", up to MAX/day). Prints a single JSON line the
widget parses, or an empty line to fall back to the bundled prompts.

Provider auto-detection: the first key file found (in this order) wins.
  ~/.config/widgetsuite/anthropic.key   Claude   (Anthropic Messages API)
  ~/.config/widgetsuite/openai.key      ChatGPT  (OpenAI Chat Completions API)
  ~/.config/widgetsuite/gemini.key      Gemini   (Google Generative Language API)
Claude also falls back to the macOS Keychain service
com.jalenedusei.widgetsuite.anthropic. With no key, the widget uses its bundled
prompt library. Override a model below if you like.
"""
import json
import os
import subprocess
import datetime
import urllib.request

CACHE = os.path.expanduser("~/Library/Caches/ws-aipull.json")
FORCE = os.path.expanduser("~/Library/Caches/ws-aipull.force")
PROFILE = os.path.expanduser("~/.config/widgetsuite/profile.txt")
CFG = os.path.expanduser("~/.config/widgetsuite")
MAX = 3

# provider -> (key file, default model, display label)
PROVIDERS = {
    "claude": ("anthropic.key", "claude-opus-4-7", "Anthropic"),
    "openai": ("openai.key",    "gpt-4o",           "OpenAI"),
    "gemini": ("gemini.key",    "gemini-2.0-flash", "Google"),
}
ORDER = ["claude", "openai", "gemini"]

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


def keychain_anthropic():
    try:
        r = subprocess.run(
            ["security", "find-generic-password", "-s",
             "com.jalenedusei.widgetsuite.anthropic", "-a", "default", "-w"],
            capture_output=True, text=True, timeout=5)
        return r.stdout.strip()
    except Exception:
        return ""


def pick_provider():
    # First key file found wins; Claude also checks the Keychain.
    for name in ORDER:
        keyfile, model, label = PROVIDERS[name]
        try:
            with open(os.path.join(CFG, keyfile)) as f:
                k = f.read().strip()
                if k:
                    return name, k, model, label
        except Exception:
            pass
    k = keychain_anthropic()
    if k:
        return "claude", k, PROVIDERS["claude"][1], PROVIDERS["claude"][2]
    return None, "", "", ""


def read_profile():
    try:
        with open(PROFILE) as f:
            return f.read().strip()
    except Exception:
        return ""


def system_prompt(category, exclusions, profile):
    lines = [
        "You write one daily prompt that the reader pastes straight into an AI",
        "chat to get genuinely useful help. Today's theme is %s." % category,
    ]
    if profile:
        lines += ["", "Tailor it to this reader:", profile, ""]
    lines += [
        "Requirements:",
        "- Address it to the assistant as a request or question it can act on:",
        "  explain, teach, brainstorm, plan, draft, critique, compare, or design.",
        "- It must have a clear purpose and lead to something useful. No vague",
        "  journaling, no self-reflection prompts.",
        "- HARD LIMIT: 150 characters or fewer. Keep it tight and specific.",
        "- Themed around the reader's interests, but practical and concrete.",
        "- No em dashes, no semicolons. Return only the prompt text, no quotes, no preface.",
    ]
    if exclusions:
        lines.append("Do not repeat or paraphrase any of these recent prompts:")
        for p in exclusions[:30]:
            lines.append("- " + p)
    return "\n".join(lines)


USER_MSG = "Write today's prompt now. One prompt only, 150 characters max, ready to paste."


def clamp(s, n=150):
    s = (s or "").strip().strip('"').strip()
    if len(s) <= n:
        return s
    cut = s[:n]
    for end in ".?!":
        i = cut.rfind(end)
        if i >= n * 0.6:
            return cut[:i + 1]
    sp = cut.rfind(" ")
    return (cut[:sp] if sp > 0 else cut).rstrip(" ,;:")


def _post(url, body, headers):
    req = urllib.request.Request(url, data=json.dumps(body).encode("utf-8"),
                                 headers=headers)
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.load(resp)


def fetch_claude(key, model, system):
    data = _post("https://api.anthropic.com/v1/messages",
                 {"model": model, "max_tokens": 120, "system": system,
                  "messages": [{"role": "user", "content": USER_MSG}]},
                 {"x-api-key": key, "anthropic-version": "2023-06-01",
                  "content-type": "application/json"})
    for b in data.get("content", []):
        if b.get("type") == "text" and b.get("text"):
            return b["text"]
    raise RuntimeError("no text")


def fetch_openai(key, model, system):
    data = _post("https://api.openai.com/v1/chat/completions",
                 {"model": model, "max_tokens": 120,
                  "messages": [{"role": "system", "content": system},
                               {"role": "user", "content": USER_MSG}]},
                 {"Authorization": "Bearer " + key,
                  "content-type": "application/json"})
    return data["choices"][0]["message"]["content"]


def fetch_gemini(key, model, system):
    url = ("https://generativelanguage.googleapis.com/v1beta/models/"
           + model + ":generateContent?key=" + key)
    data = _post(url,
                 {"systemInstruction": {"parts": [{"text": system}]},
                  "contents": [{"role": "user", "parts": [{"text": USER_MSG}]}],
                  "generationConfig": {"maxOutputTokens": 200}},
                 {"content-type": "application/json"})
    return data["candidates"][0]["content"]["parts"][0]["text"]


def fetch(provider, key, model, system):
    if provider == "claude":
        return clamp(fetch_claude(key, model, system))
    if provider == "openai":
        return clamp(fetch_openai(key, model, system))
    if provider == "gemini":
        return clamp(fetch_gemini(key, model, system))
    raise RuntimeError("unknown provider")


def emit(d):
    print(json.dumps({"prompt": d.get("prompt"), "category": d.get("category"),
                      "used": d.get("used", 0), "max": MAX,
                      "source": d.get("source", "")}))


def main():
    cache = read_cache()
    force = os.path.exists(FORCE)
    if force:
        try:
            os.remove(FORCE)
        except Exception:
            pass

    fresh_day = cache.get("date") != today()
    if not fresh_day and not force:
        emit(cache)
        return

    used = 0 if fresh_day else cache.get("used", 0)
    if force and not fresh_day:
        if used >= MAX:
            emit(cache)
            return
        used += 1

    provider, key, model, label = pick_provider()
    category = category_for_today()
    recent = cache.get("recent", [])
    profile = read_profile()
    prompt = None
    source = ""
    if provider:
        try:
            prompt = fetch(provider, key, model,
                           system_prompt(category, recent, profile))
            source = label + " / " + model
        except Exception:
            prompt = None

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
