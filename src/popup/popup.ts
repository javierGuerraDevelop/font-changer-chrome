import { mergeFontNames } from '../shared/fontUtils.js';
import { loadSettings, saveSelectedFont } from '../shared/storage.js';

const STATUS_DURATION_MS = 2000;

const fontListElement = requireElement('font-list');
const setButton = requireElement('set-button');
const statusElement = requireElement('status');

let fonts: string[] = [];
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

function renderFontList(): void {
    fontListElement.replaceChildren();

    for (const font of fonts) {
        const label = document.createElement('label');
        label.className = 'font-option';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'font';
        radio.value = font;
        radio.checked = font === selectedFont;
        radio.addEventListener('change', () => {
            selectedFont = font;
        });

        const name = document.createElement('span');
        name.textContent = font;

        label.append(radio, name);
        fontListElement.append(label);
    }
}

async function loadFonts(): Promise<void> {
    const [settings, systemFonts] = await Promise.all([loadSettings(), chrome.fontSettings.getFontList()]);

    fonts = mergeFontNames(systemFonts.map((font) => font.displayName));
    selectedFont = settings.selectedFont ?? fonts[0] ?? null;
    renderFontList();
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

void loadFonts().catch((error: unknown) => {
    console.error('Font Changer: failed to load the font list:', error);
    showStatus('Could not load the system fonts.');
});
