# Claude Chronicle Architecture

## Overview
Claude Chronicle is a single-deploy application that discovers Claude Code JSONL sessions, lets users curate them non-destructively via manifests, and renders them both as a live SPA and a single-file export. The backend never mutates original session data; it only stores and serves manifests. The frontend applies the manifest locally and renders using the same components in both runtime paths. This document defines component responsibilities, data flow, API shape, and build/CI strategy.

## Core Principles
- **Immutable source data**: JSONL session files are read-only; manifests store all edits.
- **Local-first curation**: The frontend applies manifests; backend only persists them.
- **Dual render paths**: SPA fetches data via API; export HTML embeds a serialized payload.
- **Single artifact deployment**: Backend binary bundles or packages frontend outputs.

## Data Flow
1. **Discovery**: Backend scans `~/.claude/projects/**/sessions/*.jsonl` to build an index of sessions.
2. **Parse**: Each JSONL line is parsed into records with `{ type, message, meta }`.
3. **Merge**: Streamed assistant records are merged by `message.id` (concatenate deltas into a single assistant message).
4. **Filter**: Non-renderable records (e.g., tool state, debugging) are excluded from renderable session payloads.
5. **Manifest**: Curations are stored as ordered operations in a separate manifest store (e.g., SQLite, file, or key-value). The original session remains untouched.
6. **Delivery**:
   - **SPA**: Browser calls API for `{ session, manifest, theme }`, applies manifest, renders.
   - **Export**: Backend injects `{ session, manifest, theme }` into an HTML template; browser reads `window.__CHRONICLE_DATA__` and renders with the same components.

## Component Responsibilities
### Backend (single binary)
- **Session Indexer**
  - Scans session directories.
  - Maintains session metadata cache for fast listing.
- **Session Parser**
  - Parses JSONL files into structured records.
  - Merges assistant streams by `message.id`.
  - Filters non-renderable records.
- **Manifest Store**
  - Stores ordered edit operations per session.
  - Exposes read/write operations but never mutates session data.
- **Export Renderer**
  - Injects `{ session, manifest, theme }` into the export HTML template.
  - Serves single-file HTML for sharing.
- **Static Asset Host**
  - Serves SPA assets (JS/CSS) or embedded assets.
  - Provides versioned static assets for cache busting.

### Frontend (SPA + Export)
- **Session Loader**
  - SPA: fetches session + manifest from API.
  - Export: reads from `window.__CHRONICLE_DATA__`.
- **Manifest Engine**
  - Applies ordered operations to the session model.
  - Produces a renderable view without altering original data.
- **Renderer**
  - Shared UI components for conversation, annotations, collapsed sections, and diffed edits.
- **Curation UI**
  - Creates and edits manifest operations.
  - Persists manifest changes via API.

## Manifest Model (Non-Destructive)
Manifest is an ordered list of operations:

```json
{
  "sessionId": "...",
  "theme": "light",
  "operations": [
    { "op": "delete", "targetId": "msg_123" },
    { "op": "collapse", "targetId": "msg_456" },
    { "op": "annotate", "targetId": "msg_789", "note": "Key insight" },
    { "op": "editText", "targetId": "msg_321", "text": "Corrected wording" },
    { "op": "reorder", "order": ["msg_1", "msg_2", "msg_3"] }
  ]
}
```

The frontend applies these operations in order to the in-memory view model and never alters the raw session data.

## API Shape
Base: `/api/v1`

- `GET /sessions`
  - Returns index of sessions with metadata.
  - Response:
    ```json
    [{ "id": "session_1", "title": "...", "updatedAt": "..." }]
    ```
- `GET /sessions/{id}`
  - Returns parsed session (renderable messages only).
- `GET /sessions/{id}/manifest`
  - Returns manifest for the session.
- `PUT /sessions/{id}/manifest`
  - Persists manifest (full replacement).
- `POST /exports/{id}`
  - Returns single-file HTML export (generated server-side).

SPA requests:
- `GET /sessions/{id}` + `GET /sessions/{id}/manifest` then apply manifest client-side.

Export:
- Backend renders `export.html` and injects:
  ```html
  <script>
    window.__CHRONICLE_DATA__ = { session, manifest, theme };
  </script>
  ```

## Dual Rendering Paths
- **SPA path**: Browser loads SPA assets, fetches session + manifest, applies manifest, renders.
- **Export path**: Single HTML file with all JS/CSS inlined; browser reads injected payload and renders identical components.

## Build Strategy
- **Frontend builds**:
  1. **SPA build**: standard build output with hashed assets.
  2. **Export build**: single-file HTML template (JS/CSS inlined) built from the same UI bundle.
- **Backend packaging**:
  - Embeds SPA assets and export template at build time (or packages alongside).
  - Produces a single binary (e.g., Go/Rust) or a single deployable artifact (e.g., Node + bundled assets) with static assets included.

## CI/CD
- **Lint/Test**: GitHub Actions running frontend lint/tests and backend tests.
- **Preview exports**: On PRs or main pushes, generate export HTML and publish to a GitHub Pages repo (separate target repo).
- **Release automation**: Tag-based release workflow produces:
  - Cross-platform binaries (Linux, macOS, Windows).
  - Checksums and release notes.
- **Artifacts**: Store SPA build output and export template artifacts for traceability.

## Deployment
- **Single deploy**: A single binary (or container image) serves API + static assets.
- **Local mode**: Reads `~/.claude/projects/` directly.
- **Remote mode**: Optional env var for data directory override.

## Security & Privacy
- Sessions remain local by default.
- Exports are explicit user actions.
- No mutation of source data; manifests are the only write path.
