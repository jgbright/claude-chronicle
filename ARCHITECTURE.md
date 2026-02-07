# Claude Chronicle Architecture

## Goals

Claude Chronicle is a single-binary (or single-deploy) application that turns Claude Code JSONL sessions into curated, shareable walkthroughs. The system preserves raw session data, stores edits separately as manifests, supports both a live SPA and an exportable single-file HTML, and ships as a single artifact across platforms.

## Data Flow

1. **Discovery**: Backend scans `~/.claude/projects/` for session JSONL files.
2. **Parsing**: Each JSONL record is parsed into canonical message/event structures.
3. **Merge streaming records**: Assistant records with the same `message.id` are merged into a single message entity (append streamed deltas; finalize on completion).
4. **Filter non-renderable records**: Tooling/system records that do not render in UI are discarded (retain metadata for audit if needed).
5. **Persistence**:
   - **Session store**: Raw JSONL is never mutated; parsing happens on read or cached into a read-optimized store.
   - **Manifest store**: Curation edits are stored separately as an ordered list of operations (`delete`, `collapse`, `annotate`, `editText`, `reorder`).

## Component Responsibilities

### Backend (single binary)

- **Session discovery service**
  - Watches `~/.claude/projects/` and enumerates sessions by project.
  - Exposes normalized metadata (project name, session id, timestamps).

- **Session parser/merger**
  - Reads JSONL, parses record by record.
  - Merges assistant messages by `message.id` (streamed fragments).
  - Filters non-renderable records.

- **Manifest service**
  - Stores and serves manifests separately from sessions.
  - Does **not** apply manifest server-side.

- **Export renderer**
  - Injects `{ session, manifest, theme }` into an HTML export template.
  - Emits a single HTML file with inlined JS/CSS that renders from `window.__CHRONICLE_DATA__`.

- **Static asset bundler**
  - Embeds SPA assets and export template outputs at build time.
  - Serves SPA assets from the binary or from a packaged directory.

### Frontend (shared UI components)

- **Manifest applier**
  - Applies ordered operations on a session model.
  - Purely client-side (no server-side application).

- **Renderer**
  - Renders curated walkthrough using shared components for both SPA and export.

- **Export bootstrap**
  - Reads `window.__CHRONICLE_DATA__` and mounts the app with session + manifest + theme.

## API Shape

All API routes are served by the single binary.

### Session discovery

- `GET /api/projects`
  - Returns a list of projects and session summaries.

```json
{
  "projects": [
    {
      "id": "proj-1",
      "name": "my-app",
      "sessions": [
        { "id": "session-123", "startedAt": "2025-01-05T18:20:00Z" }
      ]
    }
  ]
}
```

### Session fetch (raw)

- `GET /api/sessions/{sessionId}`
  - Returns merged, renderable session payload.

```json
{
  "session": {
    "id": "session-123",
    "messages": [
      {
        "id": "msg-1",
        "role": "assistant",
        "content": "Merged assistant message"
      }
    ]
  }
}
```

### Manifest CRUD

- `GET /api/sessions/{sessionId}/manifest`
  - Returns manifest operations.
- `PUT /api/sessions/{sessionId}/manifest`
  - Replaces manifest list; server validates schema only.

```json
{
  "manifest": [
    { "op": "delete", "targetId": "msg-2" },
    { "op": "annotate", "targetId": "msg-3", "note": "Key insight" },
    { "op": "editText", "targetId": "msg-4", "text": "Edited content" },
    { "op": "reorder", "order": ["msg-1", "msg-4", "msg-3"] }
  ]
}
```

### Export generation

- `POST /api/sessions/{sessionId}/export`
  - Returns a single HTML file (or byte stream) with injected data.

## Dual Rendering Paths

### SPA path

1. Browser loads SPA assets.
2. SPA calls `GET /api/sessions/{sessionId}` and `GET /api/sessions/{sessionId}/manifest`.
3. SPA applies manifest client-side and renders using shared components.

### Export path

1. Backend reads session + manifest + theme.
2. Backend injects `{ session, manifest, theme }` into the export template as `window.__CHRONICLE_DATA__`.
3. Browser loads the HTML file and renders using the same UI components.

## Non-Destructive Editing

- Manifest is an ordered list of operations that describes edits without mutating raw session data.
- Backend stores and serves the manifest, but **never applies it server-side**.
- Frontend applies operations in order, ensuring edit provenance and reproducibility.

## Build Strategy

### Frontend builds

1. **SPA build**: Standard output (JS/CSS/assets).
2. **Export build**: Single-file template with all JS/CSS inlined.

### Backend packaging

- Embeds both outputs in the binary at build time (e.g., `embed`/`include` in the backend runtime).
- Alternatively, packages the assets alongside the binary into a single deployment artifact (tar/zip or container).

## CI/CD Pipeline Summary

### GitHub Actions

- **Lint & test**: Backend unit tests, frontend linting, and UI tests with coverage thresholds.
- **Cross-platform releases**: Build and publish binaries for macOS, Linux, and Windows.
- **Export preview deploys**:
  - On PRs, export sample sessions to HTML.
  - Deploy to a separate GitHub Pages repository for reviewers.
- **Release automation**:
  - Tag-based release pipeline builds binaries, attaches assets, and publishes changelogs.

## Deployment Model

- Single binary runs API + serves SPA assets.
- Optional `--export` command for generating standalone HTML files.
- All data is local by default; manifests can be stored in a lightweight local database or JSON files next to sessions (without mutating session data).
