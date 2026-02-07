# Claude Chronicle Architecture (Go)

This document describes a complete architecture for **Claude Chronicle** implemented as a **single-binary (or single-deploy) Go application**. It preserves the required traits: immutable source data, manifest-driven edits, dual rendering paths, and a build pipeline that embeds frontend assets into the backend for a single artifact.

## Goals & Non‑Goals

**Goals**
- Discover and parse JSONL sessions from `~/.claude/projects/`.
- Merge streamed assistant records by `message.id`.
- Filter non‑renderable records.
- Store curation edits as a **manifest** that never mutates original session data.
- Provide **dual rendering paths**:
  - **SPA**: browser fetches session + manifest and applies manifest in the client.
  - **Export**: backend injects `{ session, manifest, theme }` into a single-file HTML template; browser renders from `window.__CHRONICLE_DATA__`.
- Build frontend twice: standard SPA and inlined single-file export template.
- Embed or package frontend outputs so the deployment is a single artifact.
- CI/CD with lint/test coverage, export preview deploys, release automation, and cross‑platform binaries.

**Non‑Goals**
- No server‑side application of the manifest (frontend only).
- No mutation of original JSONL session data.

---

## Architecture Overview

**Single deployable artifact** (Go binary) containing:
- **Backend API** (session discovery, manifest CRUD, export endpoints)
- **Embedded frontend assets** (SPA build + export HTML template)

```
+--------------------+          +-------------------------+
|  ~/.claude/projects|          |  Go Binary (single app) |
|   (JSONL sessions) |  --->    |  - Session parser       |
|                    |          |  - Manifest store       |
+--------------------+          |  - API & export         |
                                |  - Embedded frontend    |
                                +-----------+-------------+
                                            |
                                            v
                               +-------------------------+
                               | Browser (SPA or Export) |
                               +-------------------------+
```

---

## Data Flow

### 1. Discovery & Parsing
1. **Discover** JSONL session files under `~/.claude/projects/**/sessions/*.jsonl`.
2. **Parse JSONL** in a streaming manner (line‑by‑line) to avoid memory spikes.
3. **Merge streamed assistant records** by `message.id`:
   - Maintain a map of `message.id -> partial message`.
   - As new chunks arrive, append or overwrite the relevant fields.
   - On completion, store a single consolidated record.
4. **Filter non‑renderable records**:
   - Drop non‑content events (telemetry, transport, etc.).
   - Only keep records with renderable `role`/`content`.
5. **Normalize** parsed sessions into an immutable, indexed representation.

### 2. Manifest (Non‑Destructive Editing)
- **Manifest** is a list of ordered edit operations:
  - `delete`, `collapse`, `annotate`, `editText`, `reorder`
- Stored separately from session data (e.g., `manifests/<sessionId>.json`).
- The backend serves the manifest but **never applies edits** server‑side.

### 3. Rendering
- **SPA** fetches `session + manifest` then applies edits in the browser.
- **Export** endpoint injects `{ session, manifest, theme }` into a single-file HTML template.

---

## Component Responsibilities (Go)

### Backend (Go)
**Packages/Modules**
- `discover`:
  - Finds JSONL session files under `~/.claude/projects/`.
  - Builds an index of sessions (project, session ID, timestamps).
- `parser`:
  - Streaming JSONL parser.
  - Merges streamed assistant records by `message.id`.
  - Filters non‑renderable records.
- `store/session`:
  - Immutable session storage (filesystem JSON or SQLite).
- `store/manifest`:
  - Reads/writes manifest files (JSON) by session ID.
- `api`:
  - REST endpoints for listing sessions, retrieving session+manifest,
    and manifest CRUD.
- `export`:
  - Loads export HTML template and injects `window.__CHRONICLE_DATA__`.
  - Returns single-file HTML for download/preview.
- `ui`:
  - Serves embedded SPA assets.

### Frontend (Shared UI)
**Modules**
- `manifest/apply`:
  - Applies ordered edit ops to in‑memory session data.
- `renderer`:
  - Renders messages to the UI (timeline/cards).
- `export/bootstrap`:
  - Reads `window.__CHRONICLE_DATA__` and initializes the same UI.

---

## API Shape (Example)

### List projects
`GET /api/projects`
```json
{
  "projects": [
    { "id": "proj_abc", "name": "Project A", "sessions": 12 }
  ]
}
```

### List sessions
`GET /api/projects/:projectId/sessions`
```json
{
  "sessions": [
    { "id": "sess_123", "title": "Debugging run", "updatedAt": "2024-01-02T..." }
  ]
}
```

### Fetch session + manifest
`GET /api/sessions/:sessionId`
```json
{
  "session": { "id": "sess_123", "messages": [...] },
  "manifest": { "ops": [...] }
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

### Export HTML
`POST /api/sessions/:sessionId/export`
```json
{ "theme": "light" }
```
**Returns**: a single HTML file that embeds
`window.__CHRONICLE_DATA__ = { session, manifest, theme }`.

---

## Manifest Format

```json
{
  "ops": [
    { "op": "delete", "target": "msg_2" },
    { "op": "collapse", "target": "msg_5" },
    { "op": "annotate", "target": "msg_7", "text": "Important context" },
    { "op": "editText", "target": "msg_9", "text": "Edited summary" },
    { "op": "reorder", "target": "msg_10", "after": "msg_4" }
  ]
}
```

---

## Dual Rendering Paths

### SPA Path
1. Browser loads SPA assets.
2. SPA calls `GET /api/sessions/:id`.
3. Receives `{ session, manifest }`.
4. Applies manifest operations in the client.
5. Renders UI.

### Export Path
1. Backend loads session + manifest.
2. Backend injects into export template:
   ```html
   <script>
     window.__CHRONICLE_DATA__ = { session, manifest, theme };
   </script>
   ```
3. Export HTML loads the same frontend renderer.
4. Browser renders the same UI components using injected data.

---

## Build Strategy (Single Artifact)

### Frontend
Two builds from the same codebase:
1. **SPA build**: standard output (`index.html`, JS, CSS).
2. **Export build**: **single HTML file** with inlined JS/CSS (no external assets).

### Backend Embedding
- During `go build`, embed assets using `embed.FS`:
  - SPA build artifacts
  - Export template HTML
- Runtime:
  - `/` serves SPA.
  - `/export` uses the inlined template to produce the standalone HTML.

---

## CI/CD Pipeline (GitHub Actions)

### Lint & Tests
- **Backend**: `golangci-lint`, `go test ./...`
- **Frontend**: `pnpm lint`, `pnpm test`
- **Integration tests**: parse sample JSONL, manifest apply, export render.

### Preview Deploys (Export HTML)
- On PR, build a sample export HTML.
- Push to a **separate GitHub Pages repo** for preview.
- Comment preview URL in PR.

### Release Automation
- On tag:
  - Build **cross‑platform binaries** (Linux/macOS/Windows).
  - Create GitHub Release with assets.
  - Optionally publish container image.

---

## Summary

This Go-based architecture satisfies all required traits:
- Immutable session data with separate manifest edits.
- Client‑side application of manifest for both SPA and export.
- Dual frontend build outputs (SPA + single‑file export template).
- Single‑artifact deployment via embedded assets in the Go binary.
- Full CI/CD with lint/tests, previews, releases, and cross‑platform artifacts.
