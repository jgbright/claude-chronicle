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

## Dev API target

Standard dev flow is to open the app through the Go server (`http://localhost:<backend-port>`), which reverse-proxies Vite while keeping the browser origin on the backend.
In that flow, frontend API calls stay relative (`/api/*`) and always hit the same backend instance.

If you want to pin a specific backend URL, set `VITE_API_TARGET` before starting Vite:

```bash
# PowerShell
$env:VITE_API_TARGET="http://localhost:8081"
npm run dev
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
