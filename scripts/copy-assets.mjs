import { cpSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(rootDir, 'dist');
const staticDir = join(rootDir, 'static');
const srcDir = join(rootDir, 'src');

const ASSET_EXTENSIONS = new Set(['.html', '.css']);

/**
 * Copies every file accepted by `shouldCopy` from `sourceDir` into
 * `targetDir`, mirroring the directory structure.
 */
function copyTree(sourceDir, targetDir, shouldCopy) {
    for (const entry of readdirSync(sourceDir)) {
        const sourcePath = join(sourceDir, entry);
        const targetPath = join(targetDir, entry);
        if (statSync(sourcePath).isDirectory()) {
            copyTree(sourcePath, targetPath, shouldCopy);
            continue;
        }
        if (!shouldCopy(sourcePath)) continue;
        mkdirSync(dirname(targetPath), { recursive: true });
        cpSync(sourcePath, targetPath);
    }
}

mkdirSync(distDir, { recursive: true });

// Manifest and icons end up at the root of the unpacked extension.
copyTree(staticDir, distDir, () => true);

// HTML/CSS live next to their TypeScript entry points, e.g.
// src/popup/popup.html -> dist/popup/popup.html.
copyTree(srcDir, distDir, (filePath) => ASSET_EXTENSIONS.has(extname(filePath)));

console.log('Copied manifest and static assets to dist/');
