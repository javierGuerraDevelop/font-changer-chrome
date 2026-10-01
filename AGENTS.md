# AGENTS.md

TypeScript Chrome extension (Manifest V3) that replaces code/monospace fonts on web pages.

## Stack

- Chrome Extension Manifest V3, TypeScript 5.x (strict).
- Package manager: **npm** (use `npm`, never `pnpm`/`yarn`).
- Lint/format: ESLint + Prettier.
- Chrome API typings: `@types/chrome`.

## Setup

```bash
npm install           # install deps
npm run build         # emit dist/ to load as an unpacked extension
```

Then load the unpacked extension from `dist/` via `chrome://extensions` → enable Developer mode → **Load unpacked**.

## Commands

Run these from the repo root. Agents may execute them, so they must work as-is.

```bash
npm run dev           # tsc --watch for iterative dev
npm run build         # tsc -p tsconfig.json, emits to dist/, then copies static assets
npm run lint          # eslint . --max-warnings=0
npm run format        # prettier --write .
npm run typecheck     # tsc --noEmit
```

## Project Structure

- `static/manifest.json` — Manifest V3 declaration; copied to `dist/` and references the compiled JS there.
- `src/` — extension source (`*.ts`).
    - `src/content/content.ts` — content script injected into pages; must stay a classic script (no imports/exports).
    - `src/popup/` — popup entry point plus its HTML/CSS.
    - `src/shared/` — font helpers and `chrome.storage` wrappers.
- `static/` — manifest and icon, copied verbatim into `dist/`.
- `scripts/copy-assets.mjs` — copies the manifest, icon, HTML and CSS into `dist/`.
- `dist/` — build output (generated; do not edit). This is what Chrome loads.

## Code style

- Strict TypeScript: no `any`, no non-null `!` unless justified in a comment.
- Prefer named exports; one public concept per file.
- Validate external input (message payloads, storage reads, content-script data) at the boundary, then trust types inward.
- Never use `eval` or remote code; MV3 forbids it and the Web Store rejects it.
- Keep the popup stateless — persist settings via `chrome.storage`.

Example — validating a value read from storage at the boundary:

```ts
export function normalizeFontName(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const name = value.trim();
    return name.length > 0 ? name : null;
}
```

A change is done when `npm run typecheck` and `npm run lint` both pass.

## Git & PRs

1. Branch from `main`: `git switch -c feat/<short-name>`.
2. Keep commits small; use Conventional Commits (`feat:`, `fix:`, `chore:`).
3. Before pushing, run `npm run lint && npm run typecheck`.
4. Open a PR with a one-line summary and the commands you ran.

## Boundaries

- Always: edit `src/**` freely.
- Always: bump `version` in `manifest.json` for user-visible changes.
- Always: update `permissions` / `host_permissions` in `manifest.json` when adding a new Chrome API or matched site, and explain why in the commit.
- Always: fix the root cause of lint/type errors instead of suppressing them.
- Ask first: changing `package.json` deps, CI workflows, or anything under `infra/`.
- Ask first: editing `tsconfig.json` compiler options or build output paths.
- Ask first: changing `manifest_version` or removing existing permissions.
- Never: commit secrets, `.env`, or real credentials.
- Never: ship remote code or `eval`; MV3 prohibits it.
- Never: silence errors with broad `// eslint-disable` or `// @ts-ignore` to pass CI.

## More

- Usage, permissions and build details: `README.md`.
