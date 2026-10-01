// Content script that replaces code/monospace fonts on every page and the
// body font on programming-learning sites.
//
// It is declared directly in manifest.json content_scripts, so it must stay a
// classic script: no imports or exports. The font stack handling below is
// intentionally kept in sync with src/shared/fontUtils.ts.

const STORAGE_KEY = 'selectedFont';
const DEFAULT_MONO_FONT = 'monospace';
const MONO_STYLE_ID = 'custom-mono-style';
const BODY_STYLE_ID = 'learning-site-font-style';

/** Font names that indicate an element renders code or monospaced text. */
const MONO_FONT_KEYWORDS: readonly string[] = [
    'monospace',
    'courier',
    'consolas',
    'monaco',
    'menlo',
    'source code pro',
    'fira code',
    'jetbrains mono',
    'droid sans mono',
    'inconsolata',
];

/** Sites where the extension also replaces the body font with a sans stack. */
const LEARNING_SITES: readonly string[] = ['learncpp.com', 'doc.rust-lang.org', 'leetcode.com', 'neetcode.com', 'docs.rs', 'zybooks.com'];

const BODY_FONT_STACK = '"SF Pro Text", sans-serif';

let currentMonoFont = DEFAULT_MONO_FONT;

function quoteFontFamily(fontFamily: string): string {
    return `"${fontFamily.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function buildMonoFontStack(fontFamily: string): string {
    const trimmed = fontFamily.trim();
    if (trimmed.length === 0) return DEFAULT_MONO_FONT;
    if (trimmed.toLowerCase() === 'monospace') return trimmed;
    if (trimmed.includes(',') || trimmed.includes('"')) return `${trimmed}, monospace`;
    return `${quoteFontFamily(trimmed)}, monospace`;
}

function ensureStyleElement(id: string): HTMLStyleElement {
    const existing = document.getElementById(id);
    if (existing instanceof HTMLStyleElement) return existing;

    const style = document.createElement('style');
    style.id = id;
    // XML documents have no <head>; fall back to the document element.
    (document.head ?? document.documentElement).append(style);
    return style;
}

function hasMonoFont(fontFamily: string): boolean {
    const lower = fontFamily.toLowerCase();
    return MONO_FONT_KEYWORDS.some((keyword) => lower.includes(keyword));
}

function isLearningSite(): boolean {
    return LEARNING_SITES.some((site) => window.location.hostname.includes(site));
}

function replaceInlineFonts(monoFontStack: string): void {
    const onLearningSite = isLearningSite();

    for (const element of document.querySelectorAll<HTMLElement>('*')) {
        const inlineFont = element.style.fontFamily;
        if (inlineFont.length === 0) continue;

        if (hasMonoFont(inlineFont)) {
            element.style.fontFamily = monoFontStack;
        } else if (onLearningSite) {
            element.style.fontFamily = BODY_FONT_STACK;
        }
    }
}

function applyMonoFont(): void {
    const fontStack = buildMonoFontStack(currentMonoFont);
    const style = ensureStyleElement(MONO_STYLE_ID);

    style.textContent = `
    code, code *, pre, pre *, kbd, samp, tt,
    .code, .monospace, .mono, .font-mono, .text-mono,
    .terminal, .console, .console *, .terminal * {
      font-family: ${fontStack} !important;
    }

    code span, code a, code div, code em, code strong, code b, code i,
    pre span, pre a, pre div, pre em, pre strong, pre b, pre i {
      font-family: ${fontStack} !important;
    }

    .monaco-editor, .monaco-editor *,
    .cm-editor, .cm-editor *,
    .CodeMirror, .CodeMirror *,
    .ace_editor, .ace_editor *,
    .ace_text-layer, .ace_text-layer *,
    .ace_line, .ace_line *,
    .zb-code, .zb-code *,
    .code-text, .code-text *,
    .inline-code, .inline-code *,
    .zb-text-area, .zb-text-area *,
    .zylab-section, .zylab-section *,
    .activity-container, .activity-container *,
    .cr-ide-container, .cr-ide-container *,
    .coding-rooms-ide, .coding-rooms-ide *,
    .view-lines, .view-lines *,
    .highlight, .highlight *,
    [class*="language-"], [class*="language-"] *,
    [class*="code-editor"], [class*="code-editor"] *,
    .token, .keyword, .variable, .string, .comment, .function, .operator, .punctuation {
      font-family: ${fontStack} !important;
    }
  `;

    replaceInlineFonts(fontStack);
}

function applyBodyFont(): void {
    if (!isLearningSite()) return;

    const style = ensureStyleElement(BODY_STYLE_ID);
    style.textContent = `
    body, h1, h2, h3, h4, h5, h6,
    p, a, span, div, li, ul, ol,
    td, th, label, input, select, textarea, button,
    nav, header, footer, section, article, aside,
    blockquote, figcaption, details, summary {
      font-family: ${BODY_FONT_STACK} !important;
    }
  `;
}

function applyFonts(): void {
    applyBodyFont();
    applyMonoFont();
}

function readStoredFont(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const name = value.trim();
    return name.length > 0 ? name : null;
}

void chrome.storage.sync
    .get(STORAGE_KEY)
    .then((stored) => {
        currentMonoFont = readStoredFont(stored[STORAGE_KEY]) ?? DEFAULT_MONO_FONT;
        applyFonts();
    })
    .catch((error: unknown) => {
        console.error('Font Changer: failed to load the selected font:', error);
    });

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync') return;

    const change = changes[STORAGE_KEY];
    if (change === undefined) return;

    currentMonoFont = readStoredFont(change.newValue) ?? DEFAULT_MONO_FONT;
    applyMonoFont();
});

// Only re-scan inline styles here: rewriting the injected <style> elements
// from this callback would trigger the observer again.
const observer = new MutationObserver(() => {
    replaceInlineFonts(buildMonoFontStack(currentMonoFont));
});

observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style'],
});
