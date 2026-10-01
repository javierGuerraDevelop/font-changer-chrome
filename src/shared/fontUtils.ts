let measurementContext: CanvasRenderingContext2D | null | undefined;

/** Quotes a font family so it can be embedded in a CSS font shorthand. */
export function quoteFontFamily(fontFamily: string): string {
    return `"${fontFamily.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function getMeasurementContext(): CanvasRenderingContext2D | null {
    if (measurementContext === undefined) {
        measurementContext = document.createElement('canvas').getContext('2d');
    }
    return measurementContext;
}

/**
 * Detects whether a font is monospaced by measuring a narrow glyph ('i') and
 * a wide glyph ('W') on a canvas. Their advance widths are equal in a
 * monospaced font and different in a proportional font.
 */
export function isMonospaced(fontFamily: string, fontSize = 16): boolean {
    const context = getMeasurementContext();
    if (context === null) return false;

    context.font = `${fontSize}px ${quoteFontFamily(fontFamily)}`;
    const narrowWidth = context.measureText('i').width;
    const wideWidth = context.measureText('W').width;
    return Math.abs(narrowWidth - wideWidth) < 0.1;
}

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
