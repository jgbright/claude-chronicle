# Frequently Asked Questions

Common questions (and answers) for engineers new to the Claude Chronicle codebase.

---

## Why can't I just run `go build`?

The Go binary embeds the web frontend at compile time. Two `//go:embed` directives in `embed.go` require files on disk before `go build` will succeed:

```go
// embed.go:5-9
//go:embed web/dist/*
var WebDistFS embed.FS

//go:embed web/dist-export/export.html
var ExportTemplate []byte
```

If `web/dist/` or `web/dist-export/export.html` are missing, the compiler fails with an error like `pattern web/dist/*: no matching files found`. The solution is to always build the web assets first:

```bash
make web-build   # installs npm deps, builds SPA + export template
go build ./cmd/chronicle
```

Or use the single command that does both:

```bash
make build       # runs web-build, then go build
```

The `web-build` target in `Makefile:14-15` runs `npm install`, then `npm run build` (SPA into `web/dist/`) and `npm run build:export` (export template into `web/dist-export/`).

> **Why it matters:** This is the single most common "it doesn't compile" issue. If you cloned the repo and immediately ran `go build`, this is why it failed. The embedded filesystem pattern means the Go compiler needs these files at compile time, not just at runtime.

---

## Why are there two Vite configs and two entry points?

Claude Chronicle serves two very different purposes from the same React codebase:

1. **The live SPA** -- a full interactive app that fetches data from the Go API server.
2. **The export template** -- a single self-contained HTML file that reads data from an inline `<script>` tag.

Each purpose has its own Vite config and entry point:

| Purpose | Vite config | Entry point | Output dir |
|---------|-------------|-------------|------------|
| Live SPA | `web/vite.config.ts` | `web/src/main.tsx` | `web/dist/` |
| Export template | `web/vite.config.export.ts` | `web/src/export-main.tsx` | `web/dist-export/` |

The SPA config (`web/vite.config.ts`) is a standard Vite+React setup with a dev server proxy that forwards `/api` requests to the Go backend on port 8080.

The export config (`web/vite.config.export.ts:1-13`) uses `vite-plugin-singlefile` to inline all CSS and JS into a single HTML file. Its build input is `web/export.html`, not the standard `index.html`:

```ts
// web/vite.config.export.ts
plugins: [react(), viteSingleFile()],
build: {
  outDir: 'dist-export',
  rollupOptions: {
    input: 'export.html',
  },
},
```

The SPA entry point (`web/src/main.tsx`) renders the full `<App />` component which fetches session data from `/api/sessions/{id}`. The export entry point (`web/src/export-main.tsx:13`) reads from `window.__CHRONICLE_DATA__` instead:

```tsx
// web/src/export-main.tsx
const data = window.__CHRONICLE_DATA__;
```

> **Why it matters:** If you change shared components (anything under `web/src/components/` or `web/src/lib/`), your changes affect both the live app and exported HTML files. But if you change routing, API calls, or app-level layout, those only affect the SPA. Understanding which entry point you are working in prevents confusion when debugging.

---

## How does a JSONL file become a rendered page?

Here is the high-level pipeline from raw session file to pixels on screen:

```
~/.claude/projects/*/*.jsonl
        |
        v
  Discovery (internal/session/discovery.go:22)
  Scans project dirs, builds SessionInfo list
        |
        v
  Parsing (internal/session/parser.go:12)
  Reads JSONL line-by-line, unmarshals each Record
        |
        v
  Merging (internal/session/parser.go:63)
  Groups assistant records by message.id into single Messages
        |
        v
  API (internal/api/server.go:33)
  GET /api/sessions/{id} returns ParsedSession JSON
        |
        v
  React SPA renders messages and content blocks
```

**Discovery** (`internal/session/discovery.go:22-68`): `DiscoverSessions()` walks `~/.claude/projects/`, decodes directory names (e.g., `D--repos-claude-chronicle` becomes `D:/repos/claude-chronicle`), and returns metadata for every `.jsonl` file found.

**Parsing** (`internal/session/parser.go:12-44`): `ParseFile()` reads each line as a JSON record. It skips meta records and progress events, then routes user and assistant records to separate handlers.

**Merging** (`internal/session/parser.go:63-114`): `mergeRecords()` is the key step. Claude Code writes multiple JSONL records for a single assistant response (one per streaming chunk). Records sharing the same `message.id` are merged into one `Message` with all their content blocks combined. This is what turns a fragmented JSONL file into a clean conversation.

**API** (`internal/api/server.go:33-34`): The parsed session is serialized as JSON and served to the React frontend.

> **Why it matters:** Understanding the pipeline helps you pinpoint where to look when something renders wrong. Missing messages? Check the parser's skip logic (`parser.go:47-59`). Duplicate content? Check the merge logic. Wrong project name? Check `decodeProjectName` in `discovery.go:72-79`. For a detailed deep dive, see [DATA-FLOW.md](DATA-FLOW.md).

---

## Why are manifest edits applied client-side only?

The Go backend stores manifests as JSON files in `~/.claude-chronicle/manifests/` (`internal/manifest/storage.go:12-19`) but never applies them to session data. Instead, the raw session and raw manifest are both sent to the frontend, and `web/src/lib/sessionTransform.ts` applies the edits in the browser.

This is a deliberate design choice:

- **Stateless backend**: The Go server is a thin layer that reads files and serves JSON. It does not need to understand edit semantics. Adding a new edit type (e.g., `reorder`) only requires frontend changes.
- **Consistent behavior**: The exact same `sessionTransform.ts` code runs in the live SPA and in exported HTML files. There is no risk of the live preview showing one thing and the export producing another.
- **Simpler exports**: The export engine (`internal/export/engine.go:20-45`) injects both the session and manifest JSON into the template. The export's React code applies edits at render time, identical to how the SPA does it.

The manifest API routes let the frontend CRUD edit operations:

```
GET  /api/sessions/{id}/manifest          # read
PUT  /api/sessions/{id}/manifest          # replace whole manifest
POST /api/sessions/{id}/manifest/edits    # append one edit
DELETE /api/sessions/{id}/manifest/edits/{index}  # remove by index
```

But the `GET /api/sessions/{id}` endpoint always returns the **unedited** session.

> **Why it matters:** If you are debugging why an edit is not showing up, look at the frontend transform code in `sessionTransform.ts`, not the backend. The backend is only responsible for persisting the manifest -- it has no opinion about what the edits mean.

---

## How does the export pipeline produce a single HTML file?

The export pipeline has three stages: build the template, inject the data, and write the file.

**Stage 1 -- Build the template.** The Vite export build (`npm run build:export`) processes `web/export.html` through `vite-plugin-singlefile`, which inlines all JavaScript and CSS directly into the HTML. The output is a single file at `web/dist-export/export.html` with zero external dependencies.

The source template (`web/export.html:10`) contains a placeholder script:

```html
<script>window.__CHRONICLE_DATA__={};</script>
```

After the Vite build, all React code and styles are inlined into this same file, but the `__CHRONICLE_DATA__` placeholder remains as an empty object.

**Stage 2 -- Inject the data.** At export time, the Go engine (`internal/export/engine.go:20-45`) loads the built template (embedded via `embed.go:8-9`) and does a string replacement:

```go
// internal/export/engine.go:29-33
html = strings.Replace(
    html,
    "window.__CHRONICLE_DATA__={}",
    "window.__CHRONICLE_DATA__="+string(jsonData),
    1,
)
```

The `jsonData` payload includes the parsed session, the manifest (if any), and the chosen theme.

**Stage 3 -- Render.** When the exported HTML is opened in a browser, `export-main.tsx:13` reads `window.__CHRONICLE_DATA__`, which now contains the full session. The `ExportViewer` component renders it using the same shared components as the live SPA, and `sessionTransform.ts` applies any manifest edits.

> **Why it matters:** The placeholder string `window.__CHRONICLE_DATA__={}` is a hard-coded contract between the Vite build and the Go export engine. If the template does not contain this exact string, exports will silently produce pages with no data. If you are modifying `web/export.html`, keep this placeholder intact.
