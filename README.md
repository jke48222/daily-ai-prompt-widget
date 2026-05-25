# daily-ai-prompt

> One daily AI prompt on a frosted-glass panel; click to copy and open a new chat.

A widget for [Übersicht](http://tracesof.net/uebersicht/). The widget itself is
self-contained in `index.jsx`. Out of the box it rotates through a bundled
prompt library; connect it to an AI API — Claude, ChatGPT, or Gemini (below) —
to get a fresh, personalized prompt generated daily.

![screenshot](screenshot.png)

### On the desktop

The widget shown running alongside the full set:

[![Homescreen demo — click to play](homescreen-poster.png)](homescreen.mp4)

## Install

1. Install and run [Übersicht](http://tracesof.net/uebersicht/).
2. Unzip `daily-ai-prompt.widget.zip`, or copy the `daily-ai-prompt.widget`
   folder into your Übersicht widgets directory:
   `~/Library/Application Support/Übersicht/widgets/`
3. Refresh Übersicht (menu bar icon -> Refresh All).

At this point the widget works using the bundled `PROMPTS` library.

## Connect to an AI API (optional)

The widget runs a local helper that generates one prompt per day and caches it.
It supports **Claude, ChatGPT, or Gemini** and auto-detects the provider from
whichever key file you create (in this order: Claude, then OpenAI, then Gemini).
With no key it falls back to the bundled `PROMPTS` library.

1. Create the config directory and copy the helper:
   ```sh
   mkdir -p ~/.config/widgetsuite
   cp setup/ai-daily-pull-fetch.py ~/.config/widgetsuite/
   ```
2. Add **one** API key for the provider you want:
   ```sh
   # Claude  — https://console.anthropic.com
   printf '%s' 'sk-ant-...' > ~/.config/widgetsuite/anthropic.key

   # ChatGPT — https://platform.openai.com/api-keys
   printf '%s' 'sk-...'     > ~/.config/widgetsuite/openai.key

   # Gemini  — https://aistudio.google.com/apikey
   printf '%s' 'AIza...'    > ~/.config/widgetsuite/gemini.key

   chmod 600 ~/.config/widgetsuite/*.key
   ```
3. (Optional) tailor the prompt to you by adding a short profile:
   ```sh
   cp setup/profile.example.txt ~/.config/widgetsuite/profile.txt
   # then edit profile.txt with a few lines about yourself
   ```
4. Refresh Übersicht.

To force a specific provider when you have more than one key, keep only that
one key file. Models are set near the top of `ai-daily-pull-fetch.py`.

Your key never leaves your machine and is never committed (see `.gitignore`).
The model is set near the top of `ai-daily-pull-fetch.py` (`MODEL = ...`).

## How to edit

- Bundled fallback prompts: the `PROMPTS` array in `index.jsx`.
- Destination on click: the URL in the `onClick` handler in `render()`.
- All styling is in the inlined design-system block at the top of `index.jsx`.

## Bundled files

- `daily-ai-prompt.widget/index.jsx` — the widget (provider logos are inline SVG)
- `setup/ai-daily-pull-fetch.py` — optional AI helper for Claude/ChatGPT/Gemini (no key included)
- `setup/profile.example.txt` — optional profile template

## Other widgets

- [Animated Wallpaper](https://github.com/jke48222/animated-wallpaper-widget)
- [Clipboard History](https://github.com/jke48222/clipboard-history-widget)
- [Daily Astronomy Photo](https://github.com/jke48222/daily-astronomy-photo-widget)
- [Daily Tarot](https://github.com/jke48222/daily-tarot-widget)
- [GitHub Contributions](https://github.com/jke48222/github-contributions-widget)
- [Now Playing](https://github.com/jke48222/now-playing-widget)
- [Recent Album Covers](https://github.com/jke48222/recent-album-covers-widget)
- [Recent Downloads](https://github.com/jke48222/recent-downloads-widget)
- [Rotating 3D Model](https://github.com/jke48222/rotating-3d-model-widget)
- [Spinning Globe](https://github.com/jke48222/spinning-globe-widget)
- [Wallpaper Switcher](https://github.com/jke48222/wallpaper-switcher-widget)

## Author

Jalen Edusei <jalen.edusei@gmail.com>
