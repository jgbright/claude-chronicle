# Web Frontend

This directory contains the React frontend for Claude Chronicle.

## Commands

```bash
npm install
npm run dev
npm run build
npm run build:export
npm run check:bundle-budgets
npm test
npm run lint
```

## Build outputs

- `npm run build` writes the SPA bundle to `web/dist/`
- `npm run build:export` writes the single-file export template to `web/dist-export/export.html`

Both outputs are required by Go embed directives in `embed.go` for full backend builds/tests.
CI also uploads both builds to Codecov Bundle Analysis and enforces bundle budgets via `npm run check:bundle-budgets`.
Budget thresholds live in `web/bundle-budgets.json` for easier tuning.

## Main source layout

- `src/main.tsx`: live SPA entry
- `src/export-main.tsx`: export viewer entry
- `src/session/`: session list/view hooks and components
- `src/manifest/`: manifest types and `applyManifest` transform
- `src/shared/`: rendering primitives used by themes
- `src/themes/`: theme CSS and themed component sets
