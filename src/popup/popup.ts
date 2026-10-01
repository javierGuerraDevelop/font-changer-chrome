import { buildFontStack, isMonospaced, mergeFontNames } from '../shared/fontUtils.js';
import { loadSettings, normalizeFontName, saveCustomFonts, saveSelectedFont } from '../shared/storage.js';

const STATUS_DURATION_MS = 2000;

const fontListElement = requireElement('font-list');
const previewElement = requireElement('preview');
const setButton = requireElement('set-button');
const addFontButton = requireElement('add-font-button');
const statusElement = requireElement('status');

let fonts: string[] = [];
let customFonts: string[] = [];
let selectedFont: string | null = null;
let statusTimer: number | undefined;

function requireElement(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (element === null) {
        throw new Error(`Font Changer: missing required element #${id}`);
    }
    return element;
}

function showStatus(message: string): void {
    statusElement.textContent = message;
    statusElement.classList.add('show');

    if (statusTimer !== undefined) {
        window.clearTimeout(statusTimer);
    }
    statusTimer = window.setTimeout(() => {
        statusElement.classList.remove('show');
    }, STATUS_DURATION_MS);
}

function updatePreview(): void {
    previewElement.style.fontFamily = selectedFont === null ? '' : buildFontStack(selectedFont);
}

function renderFontList(): void {
    fontListElement.replaceChildren();

    for (const font of fonts) {
        // Each entry is rendered in its own typeface so it can be previewed.
        const label = document.createElement('label');
        label.className = 'font-option';
        label.style.fontFamily = buildFontStack(font);

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'font';
        radio.value = font;
        radio.checked = font === selectedFont;
        radio.addEventListener('change', () => {
            selectedFont = font;
            updatePreview();
        });

        const name = document.createElement('span');
        name.textContent = font;

        label.append(radio, name);
        fontListElement.append(label);
    }
}

async function loadFonts(): Promise<void> {
    const [settings, systemFonts] = await Promise.all([loadSettings(), chrome.fontSettings.getFontList()]);

    const monospacedFonts = systemFonts.map((font) => font.displayName).filter((fontFamily) => isMonospaced(fontFamily));

    // Manually added fonts and an already saved selection stay selectable even
    // when the monospace detection does not recognize them.
    fonts = mergeFontNames(monospacedFonts, settings.customFonts, settings.selectedFont === null ? [] : [settings.selectedFont]);
    customFonts = settings.customFonts;
    selectedFont = settings.selectedFont ?? fonts[0] ?? null;

    renderFontList();
    updatePreview();
}

async function reloadActiveTab(): Promise<void> {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    if (activeTab?.id !== undefined) {
        await chrome.tabs.reload(activeTab.id);
    }
}

setButton.addEventListener('click', () => {
    if (selectedFont === null) {
        showStatus('Select a font first.');
        return;
    }

    const font = selectedFont;
    void saveSelectedFont(font)
        .then(async () => {
            showStatus(`Saved "${font}". Reloading...`);
            await reloadActiveTab();
        })
        .catch((error: unknown) => {
            console.error('Font Changer: failed to save the selected font:', error);
            showStatus('Could not save the font.');
        });
});

addFontButton.addEventListener('click', () => {
    const answer = window.prompt('Enter the exact name of a font installed on this computer:');
    if (answer === null) return;

    const font = normalizeFontName(answer);
    if (font === null) {
        showStatus('Enter a font name.');
        return;
    }

    if (!customFonts.includes(font)) {
        customFonts = [...customFonts, font];
    }
    fonts = mergeFontNames(fonts, [font]);
    selectedFont = font;

    renderFontList();
    updatePreview();

    void saveCustomFonts(customFonts)
        .then(() => {
            showStatus(`Added "${font}".`);
        })
        .catch((error: unknown) => {
            console.error('Font Changer: failed to save the custom font list:', error);
            showStatus('Could not save the font list.');
        });
});

void loadFonts().catch((error: unknown) => {
    console.error('Font Changer: failed to load the font list:', error);
    showStatus('Could not load the system fonts.');
});
