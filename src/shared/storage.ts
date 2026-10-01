import { STORAGE_KEYS } from './constants.js';

export interface StoredSettings {
    selectedFont: string | null;
    customFonts: string[];
}

/** Validates a value read from storage and returns a trimmed font name. */
export function normalizeFontName(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const name = value.trim();
    return name.length > 0 ? name : null;
}

/** Validates a value read from storage and returns a list of font names. */
export function normalizeFontList(value: unknown): string[] {
    if (!Array.isArray(value)) return [];

    const names: string[] = [];
    for (const entry of value) {
        const name = normalizeFontName(entry);
        if (name !== null && !names.includes(name)) {
            names.push(name);
        }
    }
    return names;
}

/** Reads the persisted font settings, tolerating missing or malformed values. */
export async function loadSettings(): Promise<StoredSettings> {
    const stored = await chrome.storage.sync.get([STORAGE_KEYS.selectedFont, STORAGE_KEYS.customFonts]);
    return {
        selectedFont: normalizeFontName(stored[STORAGE_KEYS.selectedFont]),
        customFonts: normalizeFontList(stored[STORAGE_KEYS.customFonts]),
    };
}

/** Persists the font to apply on every page. */
export async function saveSelectedFont(fontFamily: string): Promise<void> {
    await chrome.storage.sync.set({ [STORAGE_KEYS.selectedFont]: fontFamily });
}

/** Persists the fonts the user added manually. */
export async function saveCustomFonts(fontFamilies: readonly string[]): Promise<void> {
    await chrome.storage.sync.set({ [STORAGE_KEYS.customFonts]: [...fontFamilies] });
}
