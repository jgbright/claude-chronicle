# Claude Chronicle Architecture (Go)

This document defines a complete architecture for **Claude Chronicle** as a single-binary (or single-deploy) Go application that converts Claude Code JSONL sessions into curated, shareable walkthroughs. It preserves immutable session data, manifest-driven edits, dual rendering paths, and a single-artifact deployment strategy.

## Goals & Constraints

**Required traits**

- Discover and parse JSONL sessions from `~/.claude/projects/`.
- Merge streamed assistant records by `message.id`.
- Filter non-renderable records.
- Store curation edits separately; never mutate original session data.
- Dual rendering paths:
  - **SPA path**: Browser calls API for session + manifest, applies manifest client-side, renders session.
  - **Export path**: Backend injects `{ session, manifest, theme }` into a single-file HTML template; browser reads `window.__CHRONICLE_DATA__` and renders with the same UI components.
- Manifest contains ordered edit operations: `delete`, `collapse`, `annotate`, `editText`, `reorder`.
- Backend stores/serves manifest only; frontend applies it.
- Two frontend builds: SPA output + single-file export template with inlined JS/CSS.
- Backend bundles frontend outputs into a single artifact.
- CI/CD: lint/test coverage, preview deploys of exported HTML to GitHub Pages (separate repo), release automation, cross-platform binaries.

## High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                            Single Binary                             │
│ ┌───────────────┐  ┌─────────────────┐  ┌──────────────────────────┐ │
│ │  API Server   │  │ Export Service  │  │ Embedded Frontend Assets │ │
│ └──────┬────────┘  └──────┬──────────┘  └───────────┬─────────────┘ │
│        │                 │                         │               │
│  ┌─────▼────────┐  ┌──────▼───────┐         ┌──────▼──────┐        │
│  │ SessionStore │  │ ManifestStore│         │ SPA + Export │        │
│  └─────┬────────┘  └──────┬───────┘         │ UI Bundles   │        │
│        │                 │                 └──────┬──────┘        │
│  ┌─────▼────────┐  ┌──────▼───────┐                │               │
│  │ JSONL Parser │  │ Manifest API │                │               │
│  └──────────────┘  └──────────────┘                │               │
└────────────────────────────────────────────────────┴───────────────┘
```

## Data Flow

### 1) Discovery & Parsing (Immutable Input)

- Scan `~/.claude/projects/**/sessions/*.jsonl`.
- Parse JSONL in a streaming fashion (line by line).
- Merge streamed assistant records by `message.id`:
  - If multiple records share a `message.id`, merge incremental content into a single message.
  - Preserve timestamps or order from the stream.
- Filter non-renderable records:
  - Remove transport/system/diagnostic records.
  - Keep only content types the UI can render.

**Important:** The parsed session data is stored immutably and never edited in-place.

### 2) Manifest (Non-Destructive Edits)

- Curation edits are stored as a **separate manifest**.
- The manifest is a list of ordered operations applied in the browser.
- The backend stores the manifest and serves it via API only.

Example manifest:

```json
{
  "ops": [
    { "op": "delete", "target": "msg_12" },
    { "op": "collapse", "target": "msg_15" },
    { "op": "annotate", "target": "msg_18", "text": "Key insight" },
    { "op": "editText", "target": "msg_21", "text": "Edited summary" },
    { "op": "reorder", "target": "msg_24", "after": "msg_20" }
  ]
}
```

## Dual Rendering Paths

### SPA Path (Client-applied Manifest)

1. Browser loads SPA from the embedded assets.
2. SPA calls `GET /api/sessions/:id` to fetch `{ session, manifest }`.
3. Client applies manifest operations.
4. UI renders the curated walkthrough.

### Export Path (Single-File HTML)

1. Backend loads session + manifest.
2. Backend injects data into export template:

```html
<script>
  window.__CHRONICLE_DATA__ = { session, manifest, theme };
</script>
```

3. The export HTML is a single file with inlined JS/CSS.
4. Browser loads HTML and renders with the **same components** as the SPA.

## Component Responsibilities

### Backend (Go)

**SessionIndexer**

- Finds JSONL sessions under `~/.claude/projects/`.
- Builds session index metadata.

**SessionParser**

- Streaming JSONL parser.
- Merges assistant chunks by `message.id`.
- Filters non-renderable records.

**SessionStore**

- Immutable storage for parsed session data.
- Backed by filesystem or SQLite.

**ManifestStore**

- Stores manifest JSON per session.
- Never mutates session data.

**ExportService**

- Loads session + manifest + theme.
- Injects them into the single-file export template.
- Streams or saves HTML output.

**API Server**

- Serves session listings, session data, manifests, and export endpoints.

### Frontend (Shared UI)

**ManifestApplier**

- Applies manifest operations in order.
- No server-side application of edits.

**SessionRenderer**

- Renders messages, tool output, and annotations.

**UI Components**

- Timeline view
- Message cards
- Collapse/expand controls
- Inline annotation UI

## API Shape

### List Projects

`GET /api/projects`

```json
{
  "projects": [
    { "id": "proj_123", "name": "Demo", "sessions": 4 }
  ]
}
```

### List Sessions

`GET /api/projects/:projectId/sessions`

```json
{
  "sessions": [
    { "id": "sess_001", "title": "Walkthrough", "updatedAt": "2024-01-02T00:00:00Z" }
  ]
}
```

### Fetch Session + Manifest

`GET /api/sessions/:sessionId`

```json
{
  "session": { "id": "sess_001", "messages": [] },
  "manifest": { "ops": [] }
}
```

### Update Manifest

`PUT /api/sessions/:sessionId/manifest`

```json
{
  "ops": [
    { "op": "annotate", "target": "msg_10", "text": "Summary note" }
  ]
}
```

### Export Single-File HTML

`POST /api/sessions/:sessionId/export`

```json
{ "theme": "light" }
```

Response: single-file HTML with embedded data.

## Build Strategy (Single Artifact)

### Frontend Builds

1. **SPA build**: `index.html`, `app.js`, `styles.css`.
2. **Export template build**: a single HTML file with JS/CSS inlined and a bootstrap that reads `window.__CHRONICLE_DATA__`.

### Backend Bundle

- Embed SPA assets and export template via Go `embed`.
- Serve SPA assets at `/`.
- Use embedded export template in `ExportService`.

**Result:** one Go binary that runs the full app and produces exports.

## CI/CD Pipeline (GitHub Actions)

### Lint & Test

- Backend: `golangci-lint`, `go test ./...`.
- Frontend: `pnpm lint`, `pnpm test`.
- Integration tests for JSONL parsing + manifest application.

### Preview Deploys (Export HTML)

- On pull requests, generate a demo export HTML.
- Publish to **GitHub Pages** in a separate preview repo.
- Post preview URL in PR.

### Releases

- Build cross-platform binaries with GoReleaser.
- Publish GitHub Releases with artifacts.
- Optionally publish a container image.

## Implementation Notes (Go)

- JSONL parsing should be streaming to avoid memory spikes.
- Merge assistant messages by `message.id`:
  - Keep a map of `message.id -> partial message`.
  - On stream completion, finalize the merged record.
- Manifest operations are applied in the browser only.
- Session data remains immutable and untouched by edits.
