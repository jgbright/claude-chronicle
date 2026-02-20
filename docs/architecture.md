# Architecture

Claude Chronicle is a local-first tool for curating and sharing Claude Code sessions as polished static sites. It ships as a single Go binary with an embedded React SPA frontend. The binary reads Claude Code's JSONL session files from `~/.claude/projects/`, provides a web UI for viewing and editing them via a non-destructive manifest layer, and exports self-contained HTML files for sharing.

## Architecture Overview

The system has two rendering paths that converge on the same React components:

```
                          ┌─────────────────────────────────┐
                          │   ~/.claude/projects/*/         │
                          │   (JSONL session files)         │
                          └──────────────┬──────────────────┘
                                         │
                          ┌──────────────▼──────────────────┐
                          │     Go: session.ParseFile()     │
                          │   discover, parse, merge, filter│
                          └──────────────┬──────────────────┘
                                         │
                    ┌────────────────────┼─────────────────────┐
                    │                                          │
          ┌─────────▼──────────┐                  ┌────────────▼───────────┐
          │   SPA Path (API)   │                  │   Export Path (CLI)    │
          │                    │                  │                        │
          │  GET /api/sessions │                  │  export.GenerateHTML() │
          │  GET /api/manifests│                  │  sanitize + inject     │
          └─────────┬──────────┘                  └────────────┬───────────┘
                    │                                          │
          ┌─────────▼──────────┐                  ┌────────────▼───────────┐
          │  React SPA         │                  │  Standalone HTML       │
          │  main.tsx          │                  │  export-main.tsx       │
          │  fetches from API  │                  │  reads __CHRONICLE_DATA│
          └─────────┬──────────┘                  └────────────┬───────────┘
                    │                                          │
                    └────────────────────┬─────────────────────┘
                                         │
                          ┌──────────────▼──────────────────┐
                          │    sessionTransform.ts           │
                          │    applyManifest()               │
                          └──────────────┬──────────────────┘
                                         │
                          ┌──────────────▼──────────────────┐
                          │    SessionViewer / ExportViewer  │
                          │    (shared React components)     │
                          └─────────────────────────────────┘
```

### Repository Structure

```
claude-chronicle/
  cmd/chronicle/            CLI entry point (serve, list, export, version)
  internal/
    session/                JSONL discovery and parsing
    manifest/               Non-destructive edit layer (stored in ~/.claude-chronicle/)
    api/                    HTTP API server with SPA fallback
    export/                 Single-file HTML export engine
    watcher/                Filesystem watcher for live updates
  embed.go                  Embeds web/dist/ and web/dist-export/ into the Go binary
  Makefile                  Build orchestration (web-build -> go build)
  web/
    index.html              SPA HTML entry (loads main.tsx)
    export.html             Export HTML entry (loads export-main.tsx, contains placeholder)
    src/
      main.tsx              SPA entry point (fetches data from API)
      export-main.tsx       Export entry point (reads window.__CHRONICLE_DATA__)
      shell/App.tsx         Root SPA component
      session/              Session API, hooks, list/view components
      manifest/             Manifest API, types, applyManifest transform
      shared/               Shared renderers and utilities
      themes/               CSS custom properties and per-theme components
      hooks/                Shared React hooks (useDeferredLoading, etc.)
      export/               Export viewer
      test/                 Test factories
    vite.config.ts          SPA build config (also configures dev proxy and Vitest)
    vite.config.export.ts   Export template build config (single-file output)
  scripts/                  PowerShell automation (sync-exports.ps1)
  samples/                  Demo JSONL files for CI export testing
```

### Package Relationships

```
cmd/chronicle/main.go
  |
  +-- internal/session     (discover + parse JSONL files)
  +-- internal/manifest    (load + save edit manifests)
  +-- internal/api         (HTTP server, uses session + manifest + export)
  +-- internal/export      (inject data into HTML template)
  +-- internal/watcher     (fsnotify filesystem monitoring)
  +-- embed.go             (provides WebDistFS and ExportTemplate)
```

## Session Discovery and JSONL Parsing

### Discovery

The `internal/session/` package scans `~/.claude/projects/*/` for JSONL session files. The base path is resolved cross-platform using `USERPROFILE` on Windows and `HOME` on Unix. The `CHRONICLE_DATA_DIR` environment variable overrides the default path.

Each subdirectory name encodes a filesystem path:

| Directory Name | Decoded Path |
|---|---|
| `D--repos-claude-chronicle` | `D:/repos/claude-chronicle` |
| `home-user-projects-myapp` | `/home/user/projects/myapp` |

The encoding scheme uses `--` to separate the drive letter, with remaining path separators replaced by `-`.

**SessionInfo struct:**

```go
type SessionInfo struct {
    ID         string    // UUID from filename
    FilePath   string    // Absolute path to JSONL file
    ProjectDir string    // Decoded project directory
    ModTime    time.Time // File modification time
}
```

### JSONL Parsing

Each line of a JSONL file is a `Record`:

```go
type Record struct {
    Type       string          `json:"type"`
    Message    *RawMessage     `json:"message"`
    IsMeta     bool            `json:"isMeta"`
    SessionID  string          `json:"sessionId"`
    // ...other fields
}

type RawMessage struct {
    ID      string          `json:"id"`
    Role    string          `json:"role"`
    Content json.RawMessage `json:"content"` // string OR []ContentBlock
    Model   string          `json:"model"`
}
```

**Polymorphic content handling.** The `content` field in user records can be either a plain string or a `[]ContentBlock` array. The parser handles both via `json.RawMessage`:

```go
func parseUserRecord(raw json.RawMessage) ([]ContentBlock, error) {
    // Try string first
    var s string
    if err := json.Unmarshal(raw, &s); err == nil {
        return []ContentBlock{{Type: "text", Text: s}}, nil
    }
    // Fall back to array
    var blocks []ContentBlock
    if err := json.Unmarshal(raw, &blocks); err != nil {
        return nil, err
    }
    return blocks, nil
}
```

**Filtering rules.** The parser discards non-renderable records:

- Meta records (`isMeta: true`)
- Internal types: `file-history-snapshot`, `progress`
- Records with no message role
- System command prefixes

**Record merging.** Assistant responses may span multiple JSONL records sharing the same `message.id`. These are merged into a single logical `Message`:

```go
func mergeRecords(records []Record) []Message {
    seen := map[string]*Message{}
    var messages []Message

    for _, rec := range records {
        if existing, ok := seen[rec.Message.ID]; ok {
            // Append blocks to existing message
            existing.Content = append(existing.Content, rec.Message.Content...)
        } else {
            msg := Message{
                ID:      rec.Message.ID,
                Role:    rec.Message.Role,
                Content: rec.Message.Content,
            }
            seen[rec.Message.ID] = &msg
            messages = append(messages, msg)
        }
    }
    return messages
}
```

**Resulting types:**

```go
type Message struct {
    ID      string         `json:"id"`
    Role    string         `json:"role"`
    Content []ContentBlock `json:"content"`
    Model   string         `json:"model,omitempty"`
}

type ParsedSession struct {
    Info     SessionInfo `json:"info"`
    Messages []Message   `json:"messages"`
}
```

**Key files:** `discovery.go`, `parser.go`, `types.go`, `search.go`

## Manifest System

Manifests provide a non-destructive edit layer. All Chronicle data is stored in `~/.claude-chronicle/manifests/{sessionId}.json`, keeping `~/.claude/` strictly read-only.

### Edit Types

| Type | Purpose | Key Fields | Status |
|---|---|---|---|
| `delete` | Remove a message from view | `blockId` | Implemented |
| `collapse` | Group messages into a summary | `blockIds`, `summary` | Implemented |
| `annotate` | Insert commentary after a message | `afterBlockId`, `content`, `id` | Implemented |
| `editText` | Replace a message's text content | `blockId`, `newContent` | Implemented |
| `reorder` | Move a message to a new position | `blockId`, `afterBlockId` | Schema only |

Note: `reorder` is defined in types but not processed by `applyManifest()`. It is silently ignored at runtime.

### Storage

```go
type Manifest struct {
    Version   int      `json:"version"`
    SessionID string   `json:"sessionId"`
    Edits     []Edit   `json:"edits"`
    Metadata  Metadata `json:"metadata,omitempty"`
}

type Edit struct {
    Type         string   `json:"type"`
    BlockID      string   `json:"blockId,omitempty"`
    BlockIDs     []string `json:"blockIds,omitempty"`
    AfterBlockID string   `json:"afterBlockId,omitempty"`
    Content      string   `json:"content,omitempty"`
    NewContent   string   `json:"newContent,omitempty"`
    Summary      string   `json:"summary,omitempty"`
    ID           string   `json:"id,omitempty"`
}

type Metadata struct {
    Title   string `json:"title,omitempty"`
    Deleted bool   `json:"deleted,omitempty"`
}
```

Sessions with `Deleted: true` in metadata are hidden by default; pass `?deleted=true` to the API to include them.

### Client-Side Application

`applyManifest()` in `sessionTransform.ts` takes `Message[]` + `EditManifest` and returns `TransformedMessage[]`:

```
  Messages[]          EditManifest
      |                    |
      v                    v
  ┌─────────────────────────────────┐
  │  Build lookup maps (one pass):  │
  │    - deleted: Set<blockId>      │
  │    - collapsed: Map<id, group>  │
  │    - annotations: Map<id, text> │
  │    - textEdits: Map<id, text>   │
  └──────────────┬──────────────────┘
                 │
                 v
  ┌─────────────────────────────────┐
  │  Iterate messages:              │
  │    - skip if deleted            │
  │    - replace text if editText   │
  │    - group if collapsed         │
  │    - append annotation after    │
  └──────────────┬──────────────────┘
                 │
                 v
         TransformedMessage[]
```

Edits are applied sequentially in array order. Order matters when edits interact (e.g., a collapse referencing a block that was deleted by an earlier edit).

**Key files:** `manifest/types.go`, `manifest/storage.go`, `manifest/sessionTransform.ts`, `manifest/types.ts`

## API Server

### Routes

```
GET    /api/projects                              List projects with visible session counts
GET    /api/sessions                              List sessions (?q=, ?project=, ?deleted=true)
GET    /api/sessions/{id}                         Get parsed session + manifest
GET    /api/sessions/{id}/manifest                Get edit manifest
PUT    /api/sessions/{id}/manifest                Replace entire manifest
POST   /api/sessions/{id}/manifest/edits          Append single edit
DELETE /api/sessions/{id}/manifest/edits/{index}  Remove edit by index
PATCH  /api/sessions/{id}/manifest/metadata       Update title/deleted metadata
POST   /api/sessions/{id}/reveal                  Reveal session file in OS explorer
POST   /api/sessions/{id}/export                  Download exported HTML
GET    /api/info                                  Build/version metadata
GET    /api/events                                SSE stream (sessions_changed, session_updated)
```

All endpoints return JSON except export, which returns `text/html` with `Content-Disposition: attachment`.

The server uses Go 1.25+ `http.ServeMux` with method routing. SPA fallback serves `index.html` for any non-API path, supporting client-side routing. The SSE hub (`hub.go`) broadcasts real-time events to connected clients.

### Development vs Production Mode

**Development:**
```
Browser :5173 <---> Vite dev server :5173 --proxy /api/--> Go server :8080
```
In dev mode, the Go server redirects non-API requests to the Vite dev server via HTTP 307.

**Production:**
```
Browser :8080 <---> Go server :8080
                      |-- /api/*     --> handler functions
                      |-- /*         --> embedded web/dist/ (SPA fallback)
```

**Key files:** `api/server.go`, `api/handlers_session.go`, `api/handlers_manifest.go`, `api/handlers_export.go`, `api/hub.go`

## React Frontend

### Two Entry Points and Two Vite Builds

| Config | Entry | Output | Purpose |
|---|---|---|---|
| `vite.config.ts` | `index.html` | `web/dist/` | Standard SPA build; dev proxy and Vitest |
| `vite.config.export.ts` | `export.html` | `web/dist-export/` | Single-file build via `vite-plugin-singlefile` |

- **SPA** (`main.tsx` -> `web/dist/`) fetches data from the API, supports editing via manifests.
- **Export reader** (`export-main.tsx` -> `web/dist-export/export.html`) is a self-contained read-only viewer that reads `window.__CHRONICLE_DATA__` at startup.

### Theme System

CSS custom properties are defined in layers:

- `themes/tokens.css` defines base layout, typography, and spacing
- `themes/claude/claude.css` overrides for the Claude theme
- `themes/copilot/copilot.css` overrides for the Copilot theme
- `themes/prism-chronicle.css` provides syntax highlighting

The `useTheme` hook manages theme state, sets the `data-theme` attribute on `<html>`, and persists the selection to `localStorage`.

Each theme provides its own component implementations via the `ThemeComponentSet` interface (`ThemeComponents.ts`). The `registry.ts` maps theme names to component sets, and `ThemeContext.ts` provides a React Context with `useThemeComponents()` for runtime dispatch.

### Component Tree and Rendering

```
App
├── Toolbar           (theme switcher, edit mode, export button)
├── SessionList       (sidebar: project groups, search, session items)
└── SessionViewer     (main content area)
    ├── applyManifest()
    └── MessageBlock (per-theme dispatch)
        ├── MarkdownContent
        ├── CodeBlock
        ├── ToolUseBlock
        ├── AnnotationBlock
        └── CollapsedGroup
```

**Key components:**

| Component | File | Role |
|---|---|---|
| `App` | `shell/App.tsx` | Root layout: sidebar, toolbar, session viewer |
| `SessionList` | `session/SessionList.tsx` | Sidebar list with search and project filter |
| `SessionViewer` | `session/SessionViewer.tsx` | Renders session with manifest applied |
| `ClaudeMessageBlock` | `themes/claude/ClaudeMessageBlock.tsx` | Claude theme message rendering |
| `CopilotMessageBlock` | `themes/copilot/CopilotMessageBlock.tsx` | Copilot theme message rendering |
| `ExportViewer` | `export/ExportViewer.tsx` | Read-only wrapper for exports |
| `Toolbar` | `shell/Toolbar.tsx` | Theme switcher, edit mode, export button |
| `ToolUseBlock` | `shared/ToolUseBlock.tsx` | Tool invocations with collapsible details |
| `CodeBlock` | `shared/CodeBlock.tsx` | Syntax-highlighted code |
| `MarkdownContent` | `shared/MarkdownContent.tsx` | Markdown text rendering |

**Message rendering dispatch:**

| Block Type | Rendered By |
|---|---|
| `text` | `MarkdownContent` |
| `thinking` | Collapsible thinking block |
| `tool_use` | `ToolUseBlock` (with paired `tool_result`) |
| `tool_result` | Rendered inline with its `tool_use` |

**User message shapes:**

| Content Shape | Rendered As |
|---|---|
| Plain string | Single text block |
| `[{type: "text", ...}]` | One or more text blocks |
| Mixed array (text + tool_result) | Text blocks + tool results |

### SPA vs Export Comparison

| Aspect | SPA | Export |
|---|---|---|
| Entry point | `main.tsx` | `export-main.tsx` |
| Data source | API (`/api/sessions/{id}`) | `window.__CHRONICLE_DATA__` |
| Build output | `web/dist/` (multiple files) | `web/dist-export/export.html` (single file) |
| Vite config | `vite.config.ts` | `vite.config.export.ts` |
| Routing | Client-side (React Router) | None (single session) |
| Editing | Full manifest CRUD | Read-only |
| Theme switching | Runtime (localStorage) | Fixed at export time |
| Session list | Sidebar with search | Not applicable |
| Manifest application | Client-side `applyManifest()` | Client-side `applyManifest()` |
| PII sanitization | None (local data) | Server-side before injection |
| Live updates | SSE from watcher | None (static file) |

## Export Pipeline

The export pipeline produces a self-contained HTML file (typically 200-500 KB) that can be opened in any browser without a server.

### Stage 1: Build the Template

Vite compiles the React export viewer using `vite-plugin-singlefile`, inlining all JavaScript and CSS into a single HTML file. The template contains an empty placeholder:

```html
<script>window.__CHRONICLE_DATA__={}</script>
```

This placeholder is embedded into the Go binary at compile time via `embed.go`:

```go
//go:embed web/dist-export/export.html
var ExportTemplate []byte
```

### Stage 2: Sanitize and Inject

The Go export engine reads the JSONL, parses and merges it, loads the manifest, then runs a three-stage PII sanitization pipeline (`sanitize.go`):

1. **Server-side delete edits** applied to physically remove deleted content (privacy guarantee: deleted content must not be recoverable from exports, even via browser dev tools)
2. **FilePath/ProjectDir stripped** from session metadata
3. **Home directory paths normalized** to `~/` across all message content, tool results, and structured patches

The sanitized data is injected via string replacement:

```go
func GenerateHTML(template []byte, data ExportData) ([]byte, error) {
    jsonBytes, err := json.Marshal(data)
    if err != nil {
        return nil, err
    }
    result := bytes.Replace(
        template,
        []byte("window.__CHRONICLE_DATA__={}"),
        append([]byte("window.__CHRONICLE_DATA__="), jsonBytes...),
        1,
    )
    // Set theme
    result = bytes.Replace(
        result,
        []byte(`data-theme="claude"`),
        []byte(fmt.Sprintf(`data-theme="%s"`, data.Theme)),
        1,
    )
    return result, nil
}
```

**ExportData struct:**

```go
type ExportData struct {
    Session  session.ParsedSession  `json:"session"`
    Manifest *manifest.Manifest     `json:"manifest,omitempty"`
    Theme    string                 `json:"theme"`
}
```

The manifest is injected raw; `applyManifest()` runs client-side in the exported HTML.

### Stage 3: Render in Browser

The exported HTML reads `__CHRONICLE_DATA__` at startup and renders with the same React components used by the SPA:

```tsx
// export-main.tsx
const data = (window as any).__CHRONICLE_DATA__ as ExportData;
ReactDOM.createRoot(document.getElementById('root')!).render(
    <ExportViewer data={data} />
);
```

**Key files:** `export/engine.go`, `export/sanitize.go`, `export-main.tsx`, `export/ExportViewer.tsx`

## Filesystem Watcher and Live Updates

The `internal/watcher/` package monitors `~/.claude/projects/` using `fsnotify`. When session files change, events are debounced (500ms) and classified, then pushed through the SSE hub:

```
fsnotify detects file change
  → watcher debounces (500ms)
    → classifies event (sessions_changed / session_updated)
      → API hub broadcasts via SSE (/api/events)
        → frontend EventSource listener triggers refetch
```

Watcher failure is non-fatal. If filesystem monitoring cannot be established (e.g., unsupported OS or permission issues), the server logs a warning but continues to operate normally. Users can still manually refresh.

## CI/CD Pipeline

### Continuous Integration

Every push to `main` and every PR triggers the CI pipeline (`.github/workflows/ci.yml`):

1. **Lint** — `go vet`, ESLint
2. **Test** — Go tests with race detector, Vitest frontend tests
3. **Coverage** — uploaded to Codecov
4. **Build** — Go binary with embedded web assets
5. **Export** — demo session exported from `samples/`
6. **Screenshots** — Playwright captures theme screenshots from Storybook
7. **Deploy** — Astro landing site, demo, coverage reports, Storybook, and component gallery to GitHub Pages

**Main pushes deploy:**

| Path | Content |
|---|---|
| `/` | Astro landing page |
| `/demo/` | Interactive demo export |
| `/coverage/go/` | Go coverage report |
| `/coverage/frontend/` | Frontend coverage report |
| `/storybook/` | Storybook component gallery |
| `/{short-sha}/demo.html` | Permalink for this commit |

**PR builds deploy:** `pr-{number}/demo.html` preview only.

### Release Flow

```
push to main
  → release-please scans conventional commits
    → opens/updates Release PR (changelog + version bump)
      → merge Release PR
        → tag created (e.g., v0.3.0)
          → GoReleaser builds cross-platform binaries
            → GitHub Release published with assets
```

**release-please** parses conventional commit prefixes. Pre-1.0, both `feat:` and `fix:` trigger patch bumps; breaking changes (`feat!:`, `fix!:`) trigger minor bumps.

**GoReleaser** builds six binary targets:

| OS | Architecture |
|---|---|
| Linux | amd64, arm64 |
| macOS | amd64, arm64 |
| Windows | amd64, arm64 |

Both jobs run in a single workflow (`.github/workflows/release-please.yml`) to work around the GitHub limitation where tags created by `GITHUB_TOKEN` don't trigger other workflows.

## Design Decisions

1. **Client-side-only manifest application** — keeps the Go backend thin and guarantees preview/export parity with a single transform implementation. Exception: during export, `SanitizeForExport()` applies delete edits server-side to physically remove deleted content (privacy guarantee).
2. **Never modify `~/.claude/`** — session files are read-only source data. All Chronicle state lives in `~/.claude-chronicle/` for non-destructive, reversible curation.
3. **Embed-dependent build** — web assets are embedded at compile time via `//go:embed` directives. The Makefile handles build ordering (`web-build` before `go build`). `go build` fails if `web/dist/` or `web/dist-export/export.html` are missing.
4. **Two separate Vite builds** — the SPA and single-file export have fundamentally different requirements (multi-file with code splitting vs. everything inlined into one HTML file).
5. **Assistant record merging** — multiple JSONL records sharing the same `message.id` are combined into one `Message` by appending content blocks in arrival order.

### Rejected Proposals

| Proposal | Reason |
|---|---|
| SQLite for session/manifest storage | Adds C dependency, complicates cross-platform builds, creates sync problems with the source JSONL files |
| API versioning (`/api/v1`) | Premature for a local-only tool with co-deployed client and server |
| `GET /api/theme` endpoint | Themes are a client-side presentational concern |
| Remote/cloud deployment | Session data contains sensitive conversation content; local-only is a feature |
| Persistent session snapshots | Data duplication and staleness; in-memory parsing with mtime invalidation is superior |
| Versioned/timestamped manifest mutations | Edit history adds complexity without value for a single-user tool |
| Removing `internal/` package convention | Would expose implementation details as public API |

## Key Types Reference

### Go Types

| Type | Package | Description |
|---|---|---|
| `Record` | `session` | Raw JSONL line |
| `RawMessage` | `session` | Message envelope: role, id, content (`json.RawMessage`) |
| `ContentBlock` | `session` | One block: text, thinking, tool_use, or tool_result |
| `Message` | `session` | Merged display-ready conversation turn |
| `ToolResult` | `session` | Parsed tool result pairing |
| `ToolUseResultData` | `session` | Structured metadata from tool executions |
| `PatchFile` | `session` | One file in a structured diff |
| `PatchHunk` | `session` | A diff hunk |
| `HunkChange` | `session` | A single diff line |
| `SessionInfo` | `session` | Discovery metadata |
| `ParsedSession` | `session` | Complete parsed session: info + messages |
| `Manifest` | `manifest` | Edit manifest: version, session ID, edits |
| `Edit` | `manifest` | Single edit operation |
| `Metadata` | `manifest` | Session-level overrides (title, deleted) |
| `ExportData` | `export` | Data injected into templates |
| `Server` | `api` | HTTP server struct |

### TypeScript Types

| Type | File | Description |
|---|---|---|
| `SessionInfo` | `session/types.ts` | Session metadata (mirrors Go) |
| `ContentBlock` | `session/types.ts` | Message content block |
| `Message` | `session/types.ts` | Conversation turn with blocks |
| `ParsedSession` | `session/types.ts` | Complete session |
| `EditManifest` | `manifest/types.ts` | Manifest with edits array |
| `Edit` | `manifest/types.ts` | Union type of all edit types |
| `TransformedMessage` | `manifest/sessionTransform.ts` | Extended Message with manifest flags |

## FAQ

**Why are manifests applied client-side instead of server-side?**
Keeping manifest application in the browser means the Go backend stays thin (store and serve, no transform logic), and there is guaranteed parity between what users see in the SPA preview and what appears in exported HTML, since both use the same `applyManifest()` function.

**What happens to deleted content during export?**
Delete edits are applied server-side by `SanitizeForExport()` in `internal/export/sanitize.go`. Deleted content is physically absent from the exported HTML, so it cannot be recovered even by inspecting the page source or using browser dev tools.

**Why must Chronicle never modify `~/.claude/`?**
The `~/.claude/` directory contains Claude Code's own session data. Chronicle treats it as read-only source material. All Chronicle state (manifests, metadata) lives under `~/.claude-chronicle/`, keeping curation fully non-destructive and reversible.

**Why is `message.content` polymorphic in parsing?**
Claude session records represent user content as either a plain string or an array of content blocks, depending on context. The parser handles both forms via `json.RawMessage`, attempting string unmarshaling first and falling back to array unmarshaling.

**How are multi-record assistant responses merged?**
Claude Code streams assistant responses as multiple JSONL records. Records sharing the same `message.id` are merged into a single `Message` by appending content blocks in the order they appear in the file.

**How do live updates from filesystem changes reach the UI?**
The `internal/watcher/` package uses `fsnotify` to monitor session files. File change events are debounced (500ms), classified, and broadcast via the SSE hub at `/api/events`. The frontend listens with an `EventSource` and triggers data refetches when events arrive.
