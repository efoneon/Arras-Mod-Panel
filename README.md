# Arras.io Mod Panel

A userscript mod panel for [arras.io](https://arras.io) with a customizable cursor reticle and auto-hold right-click for tank secondary abilities.

## Features

### Cursor
- Three reticle shapes: solid **dot**, hollow **ring**, or **crosshair**
- Customizable color, size, opacity, outline color, and outline width
- Hides the native cursor while in-game so only your reticle is visible

### Auto Secondary Fire
- Automatically holds right-click while you're playing, triggering the secondary ability on tanks that use it (Smasher boost, Auto-Smasher, Landmine cloak, Predator zoom, etc.)
- Suppresses the browser context menu while active

### General
- Collapsible mod panel — press `\` to show or hide it
- Smart in-game detection: features only activate while you're actually playing, and disable automatically on the spawn screen, while typing, or when the window loses focus
- All settings persist between sessions via `localStorage`
- Zero dependencies, no network requests, no tracking

## Install

1. Install a userscript manager:
   - [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Edge, Firefox, Safari)
   - [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Edge, Firefox)
2. [Install the script](https://github.com/efoneon/arras-mod-panel/raw/main/arras-mod-panel.user.js) — your userscript manager will prompt you to confirm.
3. Refresh [arras.io](https://arras.io), set your name, and hit Play.

Press `\` anytime to open the mod panel and tweak settings.

## Usage

| Action | How |
| --- | --- |
| Toggle mod panel | Press `\` |
| Collapse/expand a section | Click its header |
| Reset to defaults | Click **Reset** in the panel |
| Hide panel without keybind | Click **Hide** |

Both features automatically:

- **Activate** when you spawn into a match
- **Deactivate** on the spawn/menu screen, while typing in any text field, when the tab is hidden, or when the window loses focus

## License

Released under [GPL-3.0-or-later](LICENSE).

## Issues & Contributions

Bug reports and feature requests welcome at [github.com/efoneon/arras-mod-panel/issues](https://github.com/efoneon/arras-mod-panel/issues).
