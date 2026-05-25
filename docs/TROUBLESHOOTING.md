# daily-ai-prompt — Troubleshooting

### The widget doesn't appear
- Make sure Übersicht is running, then use its menu-bar icon → **Refresh all**.
- Confirm `daily-ai-prompt.widget` is in
  `~/Library/Application Support/Übersicht/widgets/`.
- Re-run `./install.sh`.

### Images or assets don't load
- Keep the `daily-ai-prompt.widget` **folder intact**. Übersicht serves bundled assets
  relative to the widgets root, so files must stay inside the folder.
- If you edited `index.jsx`, check the Übersicht console for errors
  (menu-bar icon → Debug / Show console).

### The prompt never comes from my API key
- Run `./check.sh` — it reports whether the helper is installed, a key is
  present, and whether the helper returns a prompt.
- A fresh download does **not** include the helper until you run `install.sh`,
  which copies `ai-daily-pull-fetch.py` into `~/.config/widgetsuite`.
- Verify the key directly:
  `python3 ~/.config/widgetsuite/ai-daily-pull-fetch.py` should print a JSON
  line with a non-empty `"prompt"` and a `"source"`.
