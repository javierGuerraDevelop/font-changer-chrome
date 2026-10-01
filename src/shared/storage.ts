import { STORAGE_KEYS } from './constants.js';

export interface StoredSettings {
    selectedFont: string | null;
}

/** Validates a value read from storage and returns a trimmed font name. */
export function normalizeFontName(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const name = value.trim();
    return name.length > 0 ? name : null;
}

/** Reads the persisted font settings, tolerating missing or malformed values. */
export async function loadSettings(): Promise<StoredSettings> {
    const stored = await chrome.storage.sync.get(STORAGE_KEYS.selectedFont);
    return {
        selectedFont: normalizeFontName(stored[STORAGE_KEYS.selectedFont]),
    };
}

/** Persists the font to apply on every page. */
export async function saveSelectedFont(fontFamily: string): Promise<void> {
    await chrome.storage.sync.set({ [STORAGE_KEYS.selectedFont]: fontFamily });
}
