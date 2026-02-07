# Claude Chronicle Architecture (Go)

## Goals
- **Single-deploy artifact**: one Go binary (or one container) that serves the SPA and generates single-file exports.
- **Non-destructive curation**: keep original JSONL sessions immutable; store edits in a separate manifest.
- **Dual rendering paths**: same UI components for both SPA and exported HTML.

---

## System Overview

### Core Components (single binary)
1. **Go Backend**
   - Discovers JSONL sessions in `~/.claude/projects/`.
   - Parses and normalizes records (merging streamed assistant chunks).
   - Persists immutable session data and mutable manifests.
   - Serves SPA assets and API endpoints.
   - Generates single-file HTML exports with embedded data.
2. **Frontend (Shared UI)**
   - **SPA build**: fetches session + manifest from API, applies manifest client-side.
   - **Export build**: single HTML file with inlined JS/CSS. Reads `window.__CHRONICLE_DATA__`.

---

## Data Flow

### 1) Discover & Parse JSONL Sessions
- **Discovery**: scan `~/.claude/projects/**/sessions/*.jsonl` on startup and on demand.
- **Parsing**: streaming JSONL parser to handle large sessions.
- **Merge streamed assistant chunks**: merge records by `message.id` to reconstruct final assistant messages.
- **Filter non-renderable records**: drop system/transport/log entries and keep only renderable content.
- **Persist immutable snapshots**:
  - Raw JSONL file path + metadata.
  - Normalized session JSON for fast access (never mutated).

### 2) Curation via Manifest (Non-Destructive)
- **Manifest is separate** from session data and stored in a manifest store.
- **Operations** are ordered and applied in the browser:
  - `delete`
  - `collapse`
  - `annotate`
  - `editText`
  - `reorder`
- **Backend never mutates or applies manifest**, it only serves it.

### 3) Rendering Paths
- **SPA**: Browser calls API → `{ session, manifest }` → apply manifest in the UI → render.
- **Export**: Backend injects `{ session, manifest, theme }` into HTML template → browser reads `window.__CHRONICLE_DATA__` → render with same components.

---

## Component-Level Responsibilities

### Go Backend

**SessionIndexer**
- Scans `~/.claude/projects/` and maintains a lightweight index.
- Produces project/session listings for API.

**SessionParser**
- Streaming JSONL reader.
- Merges assistant chunk records by `message.id`.
- Filters non-renderable records.
- Emits normalized `Session` objects.

**SessionStore**
- Immutable storage (filesystem JSON or SQLite).
- Separates raw sources from normalized output.

**ManifestStore**
- Read/write manifests per session.
- Versioned or timestamped updates (optional).

**ExportService**
- Loads normalized session + manifest.
- Injects into export HTML template (single file with inlined JS/CSS).
- Returns HTML to browser or writes to disk.

**AssetServer**
- Serves SPA assets and API routes from the same binary.

---

## API Shape (Example)

### Sessions
- `GET /api/projects`
  ```json
  {"projects": [{"id": "proj_1", "name": "My Project", "sessions": 3}]}
  ```

- `GET /api/projects/:projectId/sessions`
  ```json
  {"sessions": [{"id": "sess_1", "title": "Debugging", "updatedAt": "2024-01-02T00:00:00Z"}]}
  ```

- `GET /api/sessions/:sessionId`
  ```json
  {"session": {"id": "sess_1", "messages": [...]}, "manifest": {"ops": [...]}}
  ```

### Manifest
- `PUT /api/sessions/:sessionId/manifest`
  ```json
  {"ops": [{"op": "annotate", "target": "msg_12", "text": "Key insight"}]}
  ```

### Export
- `POST /api/sessions/:sessionId/export`
  ```json
  {"theme": "light"}
  ```
  Returns a single HTML file with embedded data.

---

## Frontend Architecture

### Shared UI Packages
- **renderer**: transforms session data into render nodes.
- **manifest-applier**: applies manifest operations to render nodes.
- **components**: message cards, timeline, annotations, collapse toggles.

### SPA Build
- Loads `index.html` + JS/CSS bundles.
- Fetches session + manifest from API.
- Applies manifest in browser and renders.

### Export Build
- Single HTML template with inlined JS/CSS.
- Reads `window.__CHRONICLE_DATA__ = { session, manifest, theme }`.
- Renders with same UI components as SPA.

---

## Build & Packaging Strategy (Single Artifact)

### Frontend
- Two outputs:
  1. **SPA build**: `index.html` + static assets.
  2. **Export template**: a single HTML file with all JS/CSS inlined.

### Backend
- Embed SPA assets and export template using `go:embed`.
- Produce one binary containing:
  - API server
  - SPA assets
  - Export HTML template

---

## CI/CD (GitHub Actions)

### Lint & Test
- Go: `go vet`, `go test ./...`
- Frontend: `lint`, `test` (unit + component)

### Preview Deploys
- On PR:
  - Generate export HTML for sample sessions.
  - Push to GitHub Pages in a **separate repo** for preview.

### Release Automation
- On tag:
  - Build cross-platform binaries (Linux/macOS/Windows).
  - Create GitHub release with artifacts.
  - Optional: publish container image.

---

## Notes on Session Parsing
- Use a streaming JSONL parser (bufio.Scanner or json.Decoder).
- Maintain a map keyed by `message.id` for assistant chunks.
- Only emit final merged records when stream completes.
- Keep original JSONL file immutable and stored by path reference.

---

## Why This Meets Requirements
- **Data flow**: discovers JSONL, merges chunks, filters non-renderable, immutable storage.
- **Manifest**: stored separately and applied only in browser.
- **Dual rendering**: SPA + export path use same UI.
- **Build**: two frontend builds embedded in single Go binary.
- **CI/CD**: lint/test, preview exports on Pages, release artifacts.

