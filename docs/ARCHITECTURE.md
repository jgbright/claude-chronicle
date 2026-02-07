# Architecture

Claude Chronicle is a single Go binary with an embedded React SPA for curating and sharing Claude Code sessions as polished static sites. It reads Claude Code's JSONL session files, provides a web UI for viewing and editing them, and exports self-contained HTML files.

## Repository Structure

```
claude-chronicle/
  cmd/chronicle/            CLI entry point (serve, list, export, version)
  internal/
    session/                JSONL discovery and parsing
    manifest/               Non-destructive edit layer (stored in ~/.claude-chronicle/)
    api/                    HTTP API server with SPA fallback
    export/                 Single-file HTML export engine
  embed.go                  Embeds web/dist/ and web/dist-export/ into the Go binary
  Makefile                  Build orchestration (web-build → go build)
  web/
    index.html              SPA HTML entry (loads main.tsx)
    export.html             Export HTML entry (loads export-main.tsx, contains placeholder)
    src/
      main.tsx              SPA entry point (fetches data from API)
      export-main.tsx       Export entry point (reads window.__CHRONICLE_DATA__)
      App.tsx               Root SPA component
      api/client.ts         API client functions
      components/           React components (14 components, each with a test file)
      hooks/                useSession, useManifest, useTheme
      lib/                  sessionTransform, formatUtils, toolUtils
      themes/               CSS custom property definitions
      types/                TypeScript type definitions (session.ts, manifest.ts)
    vite.config.ts          SPA build config (also configures dev proxy and Vitest)
    vite.config.export.ts   Export template build config (single-file output)
  scripts/                  PowerShell automation (sync-exports.ps1)
  samples/                  Demo JSONL files for CI export testing
```

## Go Backend

### Package Relationships

```
cmd/chronicle/main.go
  |
  +-- internal/session     (discover + parse JSONL files)
  +-- internal/manifest    (load + save edit manifests)
  +-- internal/api         (HTTP server, uses session + manifest + export)
  +-- internal/export      (inject data into HTML template)
  +-- embed.go             (provides WebDistFS and ExportTemplate)
```

### `internal/session/` -- Discovery and Parsing

Scans `~/.claude/projects/*/` for JSONL session files. Each subdirectory name encodes a filesystem path (e.g., `D--repos-claude-chronicle` decodes to `D:/repos/claude-chronicle`).

The parser reads JSONL line-by-line and filters out non-renderable records: meta records (`IsMeta`), internal types (`file-history-snapshot`, `progress`), and records with no message role. Remaining assistant records that share the same `message.id` are merged into a single logical `Message` with all content blocks combined. User record content can be either a plain string or a `[]ContentBlock` array -- the parser handles both via `json.RawMessage`.

Key files:
- `discovery.go` -- `DiscoverSessions()`, `FindSession()`, `decodeProjectName()`
- `parser.go` -- `ParseFile()`, `shouldSkipRecord()`, `mergeRecords()`, `parseUserRecord()`
- `types.go` -- Type definitions (see Key Types below)

### `internal/manifest/` -- Non-Destructive Edit Layer

Manifests store curation edits as an ordered list of operations. They live in `~/.claude-chronicle/manifests/{sessionId}.json`, keeping Claude's own data in `~/.claude/` untouched.

Five edit types are defined in the schema:

| Type | Purpose | Key Fields | Status |
|------|---------|------------|--------|
| `delete` | Remove a message from view | `blockId` | Implemented |
| `collapse` | Group messages into a summary | `blockIds`, `summary` | Implemented |
| `annotate` | Insert commentary after a message | `afterBlockId`, `content`, `id` | Implemented |
| `editText` | Replace a message's text content | `blockId`, `newContent` | Implemented |
| `reorder` | Move a message to a new position | `blockId`, `afterBlockId` | Schema only |

Note: `reorder` is defined in both Go and TypeScript types but is not yet processed by `applyManifest()` in `lib/sessionTransform.ts`. Reorder edits are silently ignored at runtime.

Edits are applied sequentially -- order matters when edits interact (e.g., a collapse referencing a block deleted by an earlier edit).

Key files:
- `types.go` -- `Manifest`, `Edit`
- `storage.go` -- `Load()`, `Save()`

### `internal/api/` -- HTTP Server

Uses Go 1.22+ `http.ServeMux` with method-based routing (e.g., `"GET /api/sessions/{id}"`). In production, serves the embedded SPA with `index.html` fallback for client-side routing. In dev mode, redirects non-API requests to the Vite dev server via HTTP 307.

Key files:
- `server.go` -- `Server` struct (`mux`, `webFS`, `devMode`, `devURL`), `NewServer()`, `registerRoutes()`, `handleSPA()`, `handleDevProxy()`
- `handlers_session.go` -- Session list and detail handlers
- `handlers_manifest.go` -- Manifest CRUD handlers
- `handlers_export.go` -- Export download handler

### `internal/export/` -- HTML Export Engine

Takes the embedded export HTML template (`web/dist-export/export.html`) and performs two string replacements using `strings.Replace()`:

1. `window.__CHRONICLE_DATA__={}` becomes `window.__CHRONICLE_DATA__={...actual JSON...}` -- injects the session, manifest, and theme as a JSON object.
2. `data-theme="claude"` becomes `data-theme="{requested theme}"` -- sets the visual theme.

The `ExportData` struct bundles the three pieces: `Session` (`*session.ParsedSession`), `Manifest` (`*manifest.Manifest`), and `Theme` (`string`). The manifest is injected raw -- `applyManifest()` runs client-side in the export viewer, not at generation time.

Key files:
- `engine.go` -- `ExportData` struct, `GenerateHTML()`

### `embed.go` -- Asset Embedding

The root-level `embed.go` uses `//go:embed` directives to bundle web assets into the binary:

```go
//go:embed web/dist/*
var WebDistFS embed.FS         // SPA files (index.html, JS, CSS)

//go:embed web/dist-export/export.html
var ExportTemplate []byte      // Single-file export template
```

This means `go build` fails if `web/dist/` and `web/dist-export/export.html` don't exist. Always run `make web-build` first.

## React Frontend

### Two Entry Points

The frontend builds into two separate outputs for different use cases:

**SPA (`main.tsx` -> `web/dist/`)** -- The interactive web application. Fetches session data from the Go API at `/api/sessions/{id}`, supports editing via manifests, and can trigger server-side exports.

**Export reader (`export-main.tsx` -> `web/dist-export/export.html`)** -- A self-contained, read-only viewer. Reads session data from `window.__CHRONICLE_DATA__` (injected by the Go export engine). No API calls, no editing -- just rendering.

### Two Vite Configs

| Config | Entry | Output | Purpose |
|--------|-------|--------|---------|
| `vite.config.ts` | `index.html` | `web/dist/` | Standard SPA build; also configures dev proxy and Vitest |
| `vite.config.export.ts` | `export.html` | `web/dist-export/` | Single-file build via `vite-plugin-singlefile`; all JS/CSS inlined |

### Theme System

Themes are implemented with CSS custom properties and controlled by the `data-theme` attribute on `<html>`.

- `themes/tokens.css` -- Base layout, typography, and spacing tokens
- `themes/claude.css` -- Claude theme color overrides
- `themes/copilot.css` -- Copilot theme color overrides
- `themes/prism-chronicle.css` -- Syntax highlighting tokens

The `useTheme` hook manages theme state, sets the `data-theme` attribute on `document.documentElement`, and persists the selection to `localStorage`.

### Key Components

| Component | File | Role |
|-----------|------|------|
| `App` | `App.tsx` | Root layout: sidebar, toolbar, session viewer |
| `SessionList` | `components/SessionList.tsx` | Sidebar list of discovered sessions |
| `SessionViewer` | `components/SessionViewer.tsx` | Renders a session's messages with manifest applied |
| `MessageBlock` | `components/MessageBlock.tsx` | Renders a single message (text, thinking, tool_use) |
| `ExportViewer` | `components/ExportViewer.tsx` | Read-only wrapper for exported HTML files |
| `Toolbar` | `components/Toolbar.tsx` | Theme switcher, edit mode toggle, export button |
| `ToolUseBlock` | `components/ToolUseBlock.tsx` | Renders tool invocations with collapsible details |
| `ThinkingBlock` | `components/ThinkingBlock.tsx` | Renders assistant thinking/reasoning blocks |
| `CodeBlock` | `components/CodeBlock.tsx` | Syntax-highlighted code display |
| `FileChangeBlock` | `components/FileChangeBlock.tsx` | Renders structured diffs |
| `AnnotationBlock` | `components/AnnotationBlock.tsx` | Renders user annotations from manifest edits |
| `CollapsedGroup` | `components/CollapsedGroup.tsx` | Renders collapsed message groups |
| `EditControls` | `components/EditControls.tsx` | Per-message editing controls (delete, annotate, etc.) |
| `MarkdownContent` | `components/MarkdownContent.tsx` | Renders markdown text content |

### Manifest Application (Client-Side Only)

`lib/sessionTransform.ts` exports `applyManifest()`, which takes a `Message[]` and an `EditManifest | null` and returns `TransformedMessage[]`. `TransformedMessage` extends `Message` with manifest-derived flags: `isCollapsed`, `collapseSummary`, `collapsedCount`, `isAnnotation`, and `isDeleted`.

The function collects all edits into lookup maps (deleted set, collapsed map, annotations map, textEdits map) in a single pass, then iterates messages to produce the transformed output. This runs in the browser for both the live SPA and static exports. The Go backend stores and serves manifests but never applies them -- see [DATA-FLOW.md](DATA-FLOW.md) for the full pipeline.

Other utility modules in `lib/`:
- `formatUtils.ts` -- Date, time, and file size formatting helpers
- `toolUtils.ts` -- Tool invocation display helpers (`toolSummary()` for generating one-line previews, `guessLanguage()` for syntax highlighting)

## API Routes

```
GET    /api/sessions                           List all discovered sessions
GET    /api/sessions/{id}                      Get a parsed session (messages + info)
GET    /api/sessions/{id}/manifest             Get the edit manifest (or empty default)
PUT    /api/sessions/{id}/manifest             Replace the entire manifest
POST   /api/sessions/{id}/manifest/edits       Append a single edit to the manifest
DELETE /api/sessions/{id}/manifest/edits/{index} Remove an edit by array index
POST   /api/sessions/{id}/export               Download an exported HTML file
```

All routes return JSON except the export endpoint, which returns `text/html` with a `Content-Disposition: attachment` header.

## How Frontend and Backend Connect

### Development Mode

```
Browser :5173 <---> Vite dev server :5173 --proxy /api/--> Go server :8080
```

Run two terminals: `cd web && npm run dev` (Vite on 5173) and `go run ./cmd/chronicle serve -dev` (Go on 8080, or `make dev`). Vite's config proxies `/api/*` requests to the Go server. The Go server's `-dev` flag makes it redirect (HTTP 307) non-API requests to the Vite dev server URL (configurable via `-dev-url`, defaults to `http://localhost:5173`).

### Production Mode

```
Browser :8080 <---> Go server :8080
                      |-- /api/*     --> handler functions
                      |-- /*         --> embedded web/dist/ (SPA fallback to index.html)
```

The single Go binary serves both the API and the SPA from embedded assets. No separate web server needed.

### Export (Offline)

```
Go binary --> read JSONL + manifest --> inject JSON into template --> standalone .html file
                                                                        |
                                                                        +--> Browser opens file://
                                                                              export-main.tsx reads
                                                                              window.__CHRONICLE_DATA__
```

Exported files are fully self-contained: all JS, CSS, and session data are inlined into a single HTML file.

## Key Design Decisions

1. **Client-side-only manifest application** -- The Go backend stores manifests but never applies them. Both the SPA and export template run `applyManifest()` in the browser. This keeps the backend simple and ensures WYSIWYG parity between live preview and exported output. See [DATA-FLOW.md](DATA-FLOW.md) for the full data flow.

2. **Never modify `~/.claude/`** -- Chronicle treats Claude Code's session files as read-only. All Chronicle-specific data (manifests) lives under `~/.claude-chronicle/`. This prevents any risk of corrupting the source data.

3. **Embed-dependent build** -- The Go binary embeds pre-built web assets at compile time. This means `web/dist/` and `web/dist-export/export.html` must exist before `go build`. The `Makefile` handles this ordering automatically. See [FAQ.md](FAQ.md) for troubleshooting embed errors.

4. **Two separate Vite builds** -- The SPA and export template have fundamentally different requirements. The SPA is a standard multi-file build with code splitting. The export template uses `vite-plugin-singlefile` to inline everything into one HTML file, since exported sessions must work offline with no external dependencies.

5. **Assistant record merging** -- Claude Code appends multiple JSONL records for a single assistant response as content blocks arrive (streaming output). The parser merges all records sharing the same `message.id` into one `Message` with the union of their content blocks, giving a clean conversation view. Records that don't represent renderable conversation turns (meta records, `file-history-snapshot`, `progress`, records with no role) are filtered out before merging.

## Key Types

### Go (`internal/`)

| Type | Package | Description |
|------|---------|-------------|
| `Record` | `session` | Raw JSONL line: type, uuid, parentUuid, sessionId, timestamp, message, isMeta, isSidechain, cwd, version, gitBranch, toolUseResult |
| `RawMessage` | `session` | Message envelope: role, id, content (as `json.RawMessage`) |
| `ContentBlock` | `session` | One block in a message: text, thinking, tool_use, or tool_result |
| `Message` | `session` | Merged, display-ready conversation turn: id, role, timestamp, blocks, textContent, toolResults |
| `ToolResult` | `session` | Parsed tool result pairing a tool_use_id with its content and optional metadata |
| `ToolUseResultData` | `session` | Structured metadata from tool executions (stdout/stderr, file patches, glob results, subagent status, etc.) |
| `PatchFile` | `session` | One file in a structured diff: old/new filenames + hunks |
| `PatchHunk` | `session` | A diff hunk: line ranges + changes |
| `HunkChange` | `session` | A single diff line: type (add/del/normal), content, line numbers |
| `SessionInfo` | `session` | Discovery metadata: id, projectDir, projectName, filePath, modTime, sizeBytes |
| `ParsedSession` | `session` | Complete parsed session: info + messages |
| `Manifest` | `manifest` | Edit manifest: version, session ID, ordered list of edits |
| `Edit` | `manifest` | Single edit operation: type + type-specific fields |
| `ExportData` | `export` | Data injected into templates: session (`*ParsedSession`) + manifest (`*Manifest`) + theme (`string`) |
| `Server` | `api` | HTTP server: mux (`*http.ServeMux`), webFS (`fs.FS`), devMode (`bool`), devURL (`string`) |

### TypeScript (`web/src/types/`)

| Type | File | Description |
|------|------|-------------|
| `SessionInfo` | `session.ts` | Session metadata (mirrors Go `SessionInfo`) |
| `ContentBlock` | `session.ts` | Message content block (text, thinking, tool_use, tool_result) |
| `Message` | `session.ts` | Conversation turn with blocks and optional text/tool results |
| `ParsedSession` | `session.ts` | Complete session: info + messages |
| `EditManifest` | `manifest.ts` | Manifest with version, session ID, and edits array |
| `Edit` | `manifest.ts` | Union type: `DeleteEdit \| CollapseEdit \| AnnotateEdit \| EditTextEdit \| ReorderEdit` |
| `TransformedMessage` | `lib/sessionTransform.ts` | Extended `Message` with manifest flags: `isCollapsed`, `collapseSummary`, `collapsedCount`, `isAnnotation`, `isDeleted` |
