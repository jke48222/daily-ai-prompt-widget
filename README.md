# daily-ai-prompt

> One daily AI prompt on a frosted-glass panel; click to copy and open a new chat.

A widget for [Übersicht](http://tracesof.net/uebersicht/). The widget itself is
self-contained in `index.jsx`. Out of the box it rotates through a bundled
prompt library; connect it to the Claude API (below) to get a fresh,
personalized prompt generated daily.

![screenshot](screenshot.png)

### On the desktop

The widget shown running alongside the full set:

<video src="https://github.com/jke48222/daily-ai-prompt-widget/raw/main/homescreen.mp4" controls width="100%"></video>

## Install

1. Install and run [Übersicht](http://tracesof.net/uebersicht/).
2. Unzip `daily-ai-prompt.widget.zip`, or copy the `daily-ai-prompt.widget`
   folder into your Übersicht widgets directory:
   `~/Library/Application Support/Übersicht/widgets/`
3. Refresh Übersicht (menu bar icon -> Refresh All).

At this point the widget works using the bundled `PROMPTS` library.

## Connect to the Claude API (optional)

The widget runs a small local helper that calls Anthropic's Messages API and
caches one prompt per day. When the helper is absent or returns nothing, the
widget falls back to the bundled library, so this step is entirely optional.

1. Create the config directory and copy the helper:
   ```sh
   mkdir -p ~/.config/widgetsuite
   cp setup/ai-daily-pull-fetch.py ~/.config/widgetsuite/
   ```
2. Add your Anthropic API key (from https://console.anthropic.com):
   ```sh
   printf '%s' 'sk-ant-...' > ~/.config/widgetsuite/anthropic.key
   chmod 600 ~/.config/widgetsuite/anthropic.key
   ```
3. (Optional) tailor the prompt to you by adding a short profile:
   ```sh
   cp setup/profile.example.txt ~/.config/widgetsuite/profile.txt
   # then edit profile.txt with a few lines about yourself
   ```
4. Refresh Übersicht.

Your key never leaves your machine and is never committed (see `.gitignore`).
The model is set near the top of `ai-daily-pull-fetch.py` (`MODEL = ...`).

## How to edit

- Bundled fallback prompts: the `PROMPTS` array in `index.jsx`.
- Destination on click: the URL in the `onClick` handler in `render()`.
- All styling is in the inlined design-system block at the top of `index.jsx`.

## Bundled files

- `daily-ai-prompt.widget/index.jsx` — the widget
- `daily-ai-prompt.widget/logo.png` — logo overlay
- `setup/ai-daily-pull-fetch.py` — optional Claude helper (no key included)
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
