# font-changer-chrome

Chrome extension (Manifest V3, TypeScript) that replaces code/monospace fonts on every page with a font you choose. On programming-learning sites it also replaces the body font with a readable sans-serif stack.

## Features

- Scans the fonts installed on the system with `chrome.fontSettings.getFontList()`.
- Keeps only monospaced fonts, detected by measuring the canvas advance widths of `i` and `W`.
- Font names shown in the UI are the actual system font names.
- Renders every font name in its own typeface and shows a live preview of the selection.
- **Add Font** lets you enter a font name manually for fonts that are not detected; custom entries are remembered.
- Applies the chosen font to `code`, `pre`, editor widgets (Monaco, CodeMirror, Ace, ...) and any element already using a monospaced font, including content added later (MutationObserver).
- Replaces the body font on learncpp.com, doc.rust-lang.org, leetcode.com, neetcode.com, docs.rs and zybooks.com with `"SF Pro Text", sans-serif`.
- YouTube is excluded from the content script.

## Development

Requires Node.js and npm.

```bash
npm install
npm run build
```

The build compiles `src/**/*.ts` to `dist/` and copies the manifest, icon, HTML and CSS there.

Other commands:

```bash
npm run dev        # tsc --watch (type-check and emit as you edit)
npm run typecheck  # tsc --noEmit
npm run lint       # eslint . --max-warnings=0
npm run format     # prettier --write .
```

## Install

1. Run `npm run build`.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the `dist/` folder.
4. Click the extension icon, pick a font and press **Set**. The current tab reloads so the change applies immediately.

## Permissions

| Permission                  | Why                                                                           |
| --------------------------- | ----------------------------------------------------------------------------- |
| `fontSettings`              | Lists the fonts installed on the system.                                      |
| `storage`                   | Persists the selected font and manually added fonts in `chrome.storage.sync`. |
| `activeTab`, `tabs`         | Reloads the current tab so the new font applies immediately.                  |
| `<all_urls>` content script | Applies the font to code blocks on every page (except YouTube).               |
