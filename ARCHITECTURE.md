# Claude Chronicle Architecture (Go single-binary)

This document defines a single-binary architecture for **Claude Chronicle**, a Go-based app that turns Claude Code JSONL sessions into curated, shareable walkthroughs. It preserves immutable source data, manifest-driven edits, and dual rendering paths.

## Goals & constraints

- **Single deploy artifact**: one Go binary (optionally with a container image wrapper).
- **Immutable source data**: never mutate original JSONL session data.
- **Manifest-based curation**: store edits separately and apply on the client.
- **Dual rendering paths**: SPA and export HTML use the same UI components.
- **Two frontend builds**: standard SPA and an inlined single-file export template.

## Data flow (immutable)

1. **Discover** JSONL sessions in `~/.claude/projects/`.
2. **Parse** JSONL line-by-line (streaming) to avoid memory spikes.
3. **Merge streamed assistant records** by `message.id`.
4. **Filter non-renderable records** (drop transport/system events).
5. **Persist parsed session snapshots** separately from raw JSONL.
6. **Store manifest edits** in a separate manifest store.

The backend **never** mutates source JSONL files. Edits are stored as a manifest and applied only in the browser.

## Component responsibilities

### Backend (Go)

- **SessionIndexer**
  - Scans `~/.claude/projects/**/sessions/*.jsonl`.
  - Maintains project/session metadata index.
- **SessionParser**
  - Streams JSONL lines.
  - Merges partial assistant messages by `message.id`.
  - Filters non-renderable records.
  - Outputs normalized session data.
- **SessionStore**
  - Stores immutable parsed session snapshots (JSON or SQLite).
  - Keeps metadata (updatedAt, title, source path).
- **ManifestStore**
  - Stores per-session manifest JSON.
  - Never modifies source session data.
- **ExportService**
  - Loads `session + manifest + theme`.
  - Injects into single-file HTML template.
  - Returns HTML for download or writes to disk.
- **HTTP API**
  - Serves SPA assets and JSON endpoints.
  - Serves export HTML.

### Frontend (shared UI for SPA + Export)

- **ManifestApplier**
  - Applies ordered edit operations in the browser.
- **SessionRenderer**
  - Converts session+manifest into renderable nodes.
- **UI Components**
  - Timeline, message cards, annotations, collapsible sections.
- **Export Bootstrap**
  - Reads `window.__CHRONICLE_DATA__` and boots UI.

## Manifest (non-destructive edits)

Manifest is an **ordered list of operations** applied in the browser:

- `delete`: remove message or block.
- `collapse`: hide a range of messages.
- `annotate`: add comment callouts.
- `editText`: replace visible text without altering source.
- `reorder`: change display order in the curated view.

**Backend responsibility:** store and serve manifest only. **Frontend responsibility:** apply it.

## Dual rendering paths

### 1) SPA path

1. Browser loads SPA.
2. SPA calls `GET /api/sessions/:id`.
3. Backend returns `{ session, manifest }`.
4. Frontend applies manifest and renders.

### 2) Export path

1. Backend loads `{ session, manifest, theme }`.
2. Backend injects them into export template:

```html
<script>
  window.__CHRONICLE_DATA__ = { session, manifest, theme };
</script>
```

3. Browser opens the single-file HTML.
4. Same UI components render using `window.__CHRONICLE_DATA__`.

## API shape

### List projects

`GET /api/projects`

```json
{
  "projects": [
    { "id": "proj_abc", "name": "My Project", "sessions": 12 }
  ]
}
```

### List sessions in project

`GET /api/projects/:projectId/sessions`

```json
{
  "sessions": [
    { "id": "sess_123", "title": "Debugging run", "updatedAt": "2024-01-02T00:00:00Z" }
  ]
}
```

### Fetch session + manifest

`GET /api/sessions/:sessionId`

```json
{
  "session": { "id": "sess_123", "messages": [] },
  "manifest": { "ops": [] }
}
```

### Update manifest

`PUT /api/sessions/:sessionId/manifest`

```json
{
  "ops": [
    { "op": "delete", "target": "msg_12" },
    { "op": "annotate", "target": "msg_15", "text": "Key insight" }
  ]
}
```

### Export session

`POST /api/sessions/:sessionId/export`

```json
{ "theme": "light" }
```

**Response:** single-file HTML export.

## Build strategy (single-binary)

### Frontend builds

1. **SPA build**
   - Standard output: `index.html`, `assets/*.js`, `assets/*.css`.
2. **Export template build**
   - **Single HTML file** with inlined JS/CSS (no external assets).
   - Bootstraps from `window.__CHRONICLE_DATA__`.

### Backend bundling

- At build time, embed the SPA assets and export template into the Go binary (using `embed` package).
- Result: **single binary** with built-in static assets and export template.

## CI/CD (GitHub Actions)

### Lint + test

- **Frontend**: lint, unit tests, build both outputs.
- **Backend**: `go test ./...` + lint.
- **Integration**: JSONL parse tests + manifest apply tests.

### Preview deploys (export HTML)

- On PR:
  - Generate sample export HTML.
  - Publish to GitHub Pages in a **separate preview repo**.
  - Post preview URL in PR comment.

### Release automation

- On tag:
  - Build cross-platform binaries (linux, macOS, windows).
  - Create GitHub release with artifacts.
  - (Optional) publish container image.

## Build pipeline summary

1. **Frontend**: build SPA + export template (inlined single-file HTML).
2. **Backend**: embed frontend outputs into Go binary.
3. **Release**: produce cross-platform single-binary artifacts.
4. **Deploy**: run the binary locally or inside a thin container.
