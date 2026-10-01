/**
 * Merges font name lists into one de-duplicated, case-insensitively sorted
 * list. The first spelling of a name wins.
 */
export function mergeFontNames(...lists: ReadonlyArray<readonly string[]>): string[] {
    const seen = new Set<string>();
    const names: string[] = [];

    for (const list of lists) {
        for (const rawName of list) {
            const name = rawName.trim();
            const key = name.toLowerCase();
            if (name.length === 0 || seen.has(key)) continue;
            seen.add(key);
            names.push(name);
        }
    }

    return names.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}
