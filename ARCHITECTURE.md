# Claude Chronicle Architecture

## Goals & Traits
- **Single-artifact deployment:** one binary (or single deploy bundle) includes backend and frontend builds.
- **Non-destructive editing:** manifests are stored separately from session data; original JSONL is never mutated.
- **Dual rendering paths:** SPA (API-driven) and export (single-file HTML with embedded data) use the same UI components.

## System Context

### Primary Data Sources
- Local JSONL sessions discovered under `~/.claude/projects/`.
- User curation manifest stored by the backend.

### Primary Outputs
- Browser-rendered SPA walkthrough.
- Exportable single-file HTML (shareable, static).

## Component Responsibilities

### 1) Session Discovery & Parsing
**Responsibilities**
- Watch/scan `~/.claude/projects/` for session JSONL files.
- Parse JSONL records into typed events.
- Merge streamed assistant records by `message.id` into a single logical message.
- Filter non-renderable records (e.g., tool call traces or metadata without display content).
- Produce a canonical, stable `Session` payload for rendering.

**Key Behaviors**
- **Merging**: If a message arrives in multiple chunks sharing `message.id`, concatenate or merge with ordering preserved.
- **Filtering**: Only keep renderable message types (user, assistant, system messages with content); discard others.

### 2) Manifest Store (Non-Destructive Edits)
**Responsibilities**
- Persist ordered edit operations as a manifest (per session or per export).
- Never mutate the original session JSONL.
- Provide CRUD endpoints for manifest management.

**Manifest Operations**
- `delete`: remove a message from the rendered output.
- `collapse`: mark a message or block as collapsed by default.
- `annotate`: add editor notes linked to a message or range.
- `editText`: replace message text during render without touching source data.
- `reorder`: reorder message sequences for narrative flow.

### 3) Rendering UI (Shared Components)
**Responsibilities**
- Render the session list with annotations, edits, and theme tokens.
- Apply manifest operations in-browser (client-side only).
- Produce consistent output in both SPA and export modes.

### 4) API Server
**Responsibilities**
- Serve session data (`Session`), manifest data, and theme metadata.
- Generate export HTML by injecting data into a single-file template.
- Host SPA assets (embedded or packaged).

**No server-side application of manifest**: the backend **serves** the manifest and leaves application to the UI.

### 5) Exporter (Single-file HTML)
**Responsibilities**
- Inject `{ session, manifest, theme }` into a template as `window.__CHRONICLE_DATA__`.
- Inline JS/CSS for a single-file artifact.
- Use the same UI bundle as the SPA build for consistent rendering.

## Data Flow (End-to-End)

1) **Discovery**
   - Scan `~/.claude/projects/` for JSONL sessions.

2) **Parse + Normalize**
   - Parse JSONL records into events.
   - Merge streamed assistant chunks by `message.id`.
   - Filter out non-renderable records.

3) **Fetch**
   - SPA fetches `session` + `manifest` from the API.

4) **Apply Manifest**
   - Frontend applies ordered operations to build the curated view.

5) **Render**
   - UI renders the curated walkthrough.

6) **Export**
   - Backend injects `{ session, manifest, theme }` into an export HTML template.
   - Export HTML loads in any browser and renders via `window.__CHRONICLE_DATA__`.

## API Shape (Representative)

### Sessions
- `GET /api/sessions`
  - Returns list of available sessions (id, title, timestamps, stats).
- `GET /api/sessions/:id`
  - Returns `Session` payload (canonical events, normalized).

### Manifests
- `GET /api/sessions/:id/manifest`
  - Returns manifest operations list.
- `PUT /api/sessions/:id/manifest`
  - Replaces manifest with ordered operations.
- `POST /api/sessions/:id/manifest/ops`
  - Append or update operations (optional convenience).

### Export
- `GET /api/sessions/:id/export`
  - Returns single-file HTML with `window.__CHRONICLE_DATA__`.

### Theme
- `GET /api/theme`
  - Returns theme tokens (colors, typography, code theme).

## Data Models (Simplified)

```ts
// Canonical Session
interface Session {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: RichTextBlock[];
  metadata?: Record<string, unknown>;
}

interface ManifestOp {
  id: string;
  type: 'delete' | 'collapse' | 'annotate' | 'editText' | 'reorder';
  targetId: string;
  payload?: Record<string, unknown>;
}
```

## Dual Rendering Paths

### SPA Path
1) Browser requests `/api/sessions/:id` and `/api/sessions/:id/manifest`.
2) UI applies manifest in-browser.
3) UI renders curated walkthrough.

### Export Path
1) Browser requests `/api/sessions/:id/export`.
2) Backend returns HTML with `window.__CHRONICLE_DATA__ = { session, manifest, theme }`.
3) Export template loads UI bundle and renders using the injected data.

## Build Strategy

### Frontend
- **Build 1 (SPA):** standard app bundle (HTML + JS + CSS).
- **Build 2 (Export Template):** single-file HTML with inlined JS/CSS; references the same UI code.

### Backend
- Embed SPA assets and export template into the binary (e.g., `embed`/`include_bytes`/`go:embed`/`pkgutil` depending on stack), or package alongside as a single deploy bundle.
- On startup, serve embedded assets via static routes.

### Single Artifact
- **Option A:** static assets embedded into the backend binary.
- **Option B:** single deploy bundle with an executable + assets directory (still a single deployable artifact).

## CI/CD Pipeline Summary

### GitHub Actions
1) **Lint & Test**
   - Lint frontend and backend.
   - Run unit tests and snapshot/render tests.
2) **Build**
   - Build SPA and export template.
   - Build backend with embedded assets.
3) **Release**
   - Package cross-platform binaries (Linux, macOS, Windows).
   - Generate release notes and tag release.
4) **Preview Deploys**
   - Export sample sessions to HTML.
   - Push static exports to a GitHub Pages repo (separate repo) for previews.

## Security & Privacy Considerations
- No session mutation; only manifest edits are persisted.
- Optional local-only mode with no external network calls.
- Exported HTML is a self-contained static file; no API calls required.

## Open Stack Options (Examples)
- **Backend:** Go (embed), Rust (axum + include_bytes), Node (single binary via pkg/nexe), or Python (zipapp).
- **Frontend:** React/Vite, SvelteKit, or Solid.
- **Storage:** SQLite (manifests), filesystem JSON, or embedded KV.

## End-to-End Summary
- Sessions are read from disk, normalized, and served via API.
- Manifests store edits only, applied in-browser.
- One UI renders both SPA and export via injected data.
- Build pipeline yields a single artifact and previewable exports.
