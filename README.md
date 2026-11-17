# Recipe Checklist

Paste a recipe link and get the ingredients and a step-by-step checklist you can tick off.

Live at https://brotherpolo.github.io/recipes/

- Reads the recipe data most recipe sites embed (schema.org), fetched through Jina Reader.
- Works on phones and tablets; install it to your home screen.
- Android: once installed, it shows up in the Share menu.
- Opening `?url=<recipe link>` loads that recipe straight away (used by the iPhone Shortcut).

## Chrome extension

`extension/` is a small Chrome extension, **Send to Recipe Checklist**: on any recipe page, click its toolbar button (or press Alt+Shift+R) and Recipe Checklist opens in a new tab with that recipe. It reads the recipe from the page in your own browser, so it works on sites that block link loading. It asks only for `activeTab` and `scripting`, so it can read just the tab you click it on, at that moment.

Install: download `recipe-checklist-extension.zip` (linked in the app under "Site blocked? Use the Send button"), unzip it, open `chrome://extensions`, turn on Developer mode, click **Load unpacked** and choose the folder. When you change `extension/`, rebuild the zip and bump `version` in `extension/manifest.json`.
