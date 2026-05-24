# daily-ai-prompt

> One daily AI prompt on a frosted-glass panel; click to copy and open a new chat.

A self-contained widget for [Übersicht](http://tracesof.net/uebersicht/). The
entire widget lives in `index.jsx` (the shared design system is inlined), so it
runs on any Mac with no extra files beyond the bundled assets.

![screenshot](screenshot.png)

## Install

1. Install and run [Übersicht](http://tracesof.net/uebersicht/).
2. Unzip `daily-ai-prompt.widget.zip`, or copy the `daily-ai-prompt.widget` folder into your
   Übersicht widgets directory:
   `~/Library/Application Support/Übersicht/widgets/`
3. Refresh Übersicht (menu bar icon -> Refresh All).

## Notes

- Rotates through a bundled prompt library by day of year.
- Optional: install the Instrument Serif and Geist font families for the intended typography; system fonts are used as a fallback.

## How to edit

Edit the PROMPTS array in index.jsx to change the library. Change the destination URL in the onClick handler in render().

All visual styling (colors, fonts, the card shell, drag/resize handles) is in
the inlined design-system block at the top of `index.jsx`.

## Bundled files

- `index.jsx`
- `logo.png`

## Submitting to the Übersicht gallery

Create a public GitHub repo with `widget.json`, `daily-ai-prompt.widget.zip`, and a
258x160 (or 516x320 hi-res) `screenshot.png`, then
[open an issue](https://github.com/felixhageloh/uebersicht-widgets/issues) with the URL.

## Author

Jalen Edusei <jalen.edusei@gmail.com>
