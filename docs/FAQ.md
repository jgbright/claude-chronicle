# Frequently Asked Questions

Common questions (and answers) for engineers new to the Claude Chronicle codebase.

---

## Getting Started

### 1. How do I build and run this project locally?

**Prerequisites:** Go 1.25+ and Node.js 18+.

**Full production build:**

```bash
make build   # builds web assets, then compiles Go binary
```

This runs `web-build` (npm install + two Vite builds) then compiles the Go binary with embedded assets. The output is `claude-chronicle.exe`.

**Development mode** (two terminals):

```bash
cd web && npm run dev              # Terminal 1: Vite dev server on port 5173
go run ./cmd/chronicle serve -dev  # Terminal 2: Go server on port 8080, proxying to Vite
```

The `-dev` flag (`cmd/chronicle/main.go`) tells the Go server to redirect all non-API requests to the Vite dev server instead of serving embedded assets. This gives you hot module reloading for frontend changes.

**Key file references:** `Makefile` (build targets), `cmd/chronicle/main.go` (CLI flags and serve command).

---

### 2. Why does `go build` fail with embed errors?

The Go binary embeds the entire web frontend at compile time. Two `//go:embed` directives in `embed.go` require specific files to exist on disk before compilation:

- `web/dist/` — the compiled React SPA (produced by `npm run build`)
- `web/dist-export/export.html` — the single-file export template (produced by `npm run build:export`)

If either is missing, you get an error like `pattern web/dist/*: no matching files found`. The fix:

```bash
make web-build   # builds both web/dist/ and web/dist-export/
go build ./cmd/chronicle
```

Or just `make build`, which runs `web-build` as a prerequisite.

**Key file references:** `embed.go` (embed directives), `Makefile` (`web-build` target).

---

### 3. What's the difference between `make dev` and `make build`?

| Aspect | `make build` | `make dev` |
|--------|-------------|-----------|
| Web assets | Builds them (`web-build`) | Skips — expects Vite dev server running separately |
| Go compilation | Compiles to binary | Uses `go run` (no binary produced) |
| Embedded assets | Baked into binary | Not used — proxies to Vite at `:5173` |
| Use case | Production / CI | Local development with HMR |

`make dev` is a shortcut for `go run ./cmd/chronicle serve -dev`. It requires the Vite dev server to be running in a separate terminal (`cd web && npm run dev`). The Go server proxies all non-API requests to Vite, so frontend changes appear instantly without rebuilding.

**Key file references:** `Makefile` (`build`, `dev`, `web-build` targets), `internal/api/server.go` (dev proxy handler).

---

## Architecture

### 4. How does one Go binary serve a React frontend?

The Go binary embeds the entire compiled SPA filesystem via `//go:embed web/dist/*` in `embed.go`. At runtime, the HTTP server in `internal/api/server.go` serves these embedded files with SPA fallback logic: it tries to match the request path to an embedded file, and if no file matches, it serves `index.html` so React Router can handle client-side routing. Hashed asset filenames (e.g., `index-abc123.js`) get long-lived cache headers.

In development mode (`-dev` flag), the server ignores the embedded filesystem entirely and redirects non-API requests to the Vite dev server URL (default `http://localhost:5173`).

**Key file references:** `embed.go` (embed directives), `internal/api/server.go` (SPA fallback handler and dev proxy handler), `cmd/chronicle/main.go` (`-dev` and `-dev-url` flags).

---

### 5. Why are there two Vite configs and two entry points?

Claude Chronicle serves two purposes from the same React codebase:

1. **The live SPA** — a full interactive app that fetches data from the Go API.
2. **The export template** — a self-contained single HTML file with inline data.

| Purpose | Vite config | Entry point | Output |
|---------|-------------|-------------|--------|
| Live SPA | `web/vite.config.ts` | `web/src/main.tsx` | `web/dist/` |
| Export template | `web/vite.config.export.ts` | `web/src/export-main.tsx` | `web/dist-export/` |

The SPA config is a standard Vite+React setup with a dev server proxy forwarding `/api` to the Go backend. The export config uses `vite-plugin-singlefile` to inline all CSS and JS into one HTML file.

The SPA entry renders the full `<App />` and fetches from `/api/sessions/{id}`. The export entry renders an `<ExportViewer />` that reads data from `window.__CHRONICLE_DATA__` (injected by the Go export engine).

**Key file references:** `web/vite.config.ts`, `web/vite.config.export.ts`, `web/src/main.tsx`, `web/src/export-main.tsx`, `web/src/export/ExportViewer.tsx`.

---

### 6. How does the theme system work?

The theme system uses a component dispatch pattern with four layers:

1. **Interface** (`web/src/themes/ThemeComponents.ts`): Defines `ThemeComponentSet` — each theme must provide `Wrapper`, `MessageBlock`, `AnnotationBlock`, and `CollapsedGroup` components.

2. **Registry** (`web/src/themes/registry.ts`): Maps theme names (`"claude"`, `"copilot"`) to their component sets. `getThemeComponents(theme)` returns the right set.

3. **Context** (`web/src/themes/ThemeContext.ts`): `ThemeComponentProvider` wraps the app, and `useThemeComponents()` lets any child component access the active theme's components.

4. **CSS tokens** (`web/src/themes/tokens.css`): Defines CSS custom properties for colors, spacing, etc. Each theme overrides these via `web/src/themes/claude/claude.css` and `web/src/themes/copilot/copilot.css`, controlled by a `data-theme` attribute on `<html>`.

The `useTheme()` hook (`web/src/themes/useTheme.ts`) persists the selected theme in `localStorage` and sets the `data-theme` attribute. Shared rendering primitives like `CodeBlock`, `MarkdownContent`, and `ToolUseBlock` live in `web/src/shared/` and are imported by both theme implementations.

**Key file references:** `web/src/themes/ThemeComponents.ts`, `web/src/themes/registry.ts`, `web/src/themes/ThemeContext.ts`, `web/src/themes/useTheme.ts`, `web/src/themes/claude/components.ts`, `web/src/themes/copilot/components.ts`.

---

### 7. What's the difference between view-state and manifest state?

| Aspect | View-state | Manifest state |
|--------|-----------|---------------|
| What | Ephemeral UI toggles (collapse thinking, hide tool results) | Persistent curation edits (delete, collapse, annotate, edit text, reorder) |
| Storage | React Context, in-memory only | Go server at `~/.claude-chronicle/manifests/`, persisted as JSON |
| Lifetime | Resets on session switch | Persists across sessions and app restarts |
| Undo/redo | Not affected | Fully supported |

View-state is managed by `BulkCollapseContext` (`web/src/session/BulkCollapseContext.ts`) and related state in `App.tsx`. When the user switches sessions, all view-state resets to defaults. It controls bulk visual toggles like "collapse all thinking blocks" without creating manifest edits.

Manifest state represents intentional curation — deleting a message, adding an annotation, collapsing a group with a summary. These edits are sent to the Go API (`POST /api/sessions/{id}/manifest/edits`) and stored permanently. They participate in undo/redo.

Both are combined at render time: `applyManifest()` in `web/src/manifest/sessionTransform.ts` takes the manifest edits and view-state options as inputs and produces the final transformed message list.

**Key file references:** `web/src/session/BulkCollapseContext.ts`, `web/src/manifest/sessionTransform.ts`, `web/src/manifest/types.ts`.

---

## Session Parsing

### 8. Why can the `content` field be either a string or an array?

Claude Code's JSONL format uses different content representations depending on the message role. User messages typically store `content` as a plain string, though tool result messages from the user role use an array of `ContentBlock` objects. Assistant messages always store it as an array of `ContentBlock` objects (text, tool use, thinking, etc.).

The parser handles this with `json.RawMessage` in the `RawMessage` struct (`internal/session/types.go`). Instead of immediately deserializing the content field, `json.RawMessage` stores the raw JSON bytes. The parser tries both formats: `parseUserRecord()` tries string first and falls back to an array, while `parseContentBlocks()` (used for assistant messages) tries array first and falls back to string (`internal/session/parser.go`).

This dual-format handling also appears in `discovery.go`'s `extractUserText()` function, which needs to extract user text during metadata scanning without fully parsing the file.

**Key file references:** `internal/session/types.go` (`RawMessage` struct), `internal/session/parser.go` (dual unmarshal logic).

---

### 9. How does message merging work for assistant responses?

Claude Code writes multiple JSONL records for a single assistant response — one per streaming chunk. The parser's `mergeRecords()` function (`internal/session/parser.go`) combines these fragments into complete messages.

It uses a map of `message.id` to position in the output slice. When a new assistant record arrives:

- If no message with that ID exists yet, a new `Message` is created and the ID is registered in the map.
- If a message with that ID already exists, the new record's content blocks are appended to the existing message's block list.

Records without a `message.id` are treated as standalone messages. The result is a clean conversation where each assistant turn is a single `Message` with all its content blocks (thinking, tool calls, text) in order.

**Key file references:** `internal/session/parser.go` (`mergeRecords()` function).

---

### 10. How does session discovery find and decode project directories?

`DiscoverSessions()` in `internal/session/discovery.go` walks `~/.claude/projects/`, where each subdirectory name is an encoded filesystem path. The `decodeProjectName()` function reverses the encoding:

- **Windows paths**: `D--repos-chronicle` becomes `D:/repos/chronicle`. The first character is the drive letter, `--` indicates a drive prefix, and all remaining dashes become path separators (note: hyphenated directory names cannot be round-tripped through this encoding).
- **Unix paths**: Dashes are simply replaced with forward slashes.

The discovery process also scans the first ~50 lines of each JSONL file (`scanSessionMetadata()`) to extract the working directory (`cwd`) and the first user message as a title. If a `cwd` is found, it overrides the decoded directory name, providing a more accurate project path.

Cross-platform home directory resolution uses `USERPROFILE` on Windows and `HOME` on Unix.

**Key file references:** `internal/session/discovery.go` (`DiscoverSessions()`, `decodeProjectName()`, `scanSessionMetadata()`).

---

## Manifest System

### 11. What is the manifest system and why does it exist?

The manifest system is a non-destructive edit layer for curating session content. It allows users to delete messages, collapse groups with summaries, add annotations, edit text, and reorder blocks — all without modifying the original JSONL session files.

Manifests are stored as JSON files in `~/.claude-chronicle/manifests/`, one per session (`internal/manifest/storage.go`). Each manifest has an array of `Edit` objects applied sequentially, plus optional `Metadata` for session-level overrides like custom titles and soft-delete flags (`internal/manifest/types.go`).

The five edit types are: `delete` (remove a block), `collapse` (group blocks with a summary), `annotate` (insert commentary after a block), `editText` (replace message content), and `reorder` (change block order).

This design upholds a core constraint: **never modify `~/.claude/`**. Session files are read-only; all Chronicle data lives under `~/.claude-chronicle/`.

**Key file references:** `internal/manifest/types.go` (data structures and edit types), `internal/manifest/storage.go` (filesystem persistence).

---

### 12. Why are manifests applied client-side instead of server-side?

The Go backend stores and serves manifests but does not apply them to message content. The `GET /api/sessions/{id}` endpoint returns the session with **unedited messages** alongside the manifest (only manifest title overrides are applied to metadata). The frontend combines session data and manifest data at render time using `applyManifest()` in `web/src/manifest/sessionTransform.ts`.

This is deliberate:

- **Stateless backend**: The Go server is a thin file-reading layer. Adding a new edit type only requires frontend changes.
- **Consistent behavior**: The same `sessionTransform.ts` code runs in the live SPA and in exported HTML files. The live preview and exported output are always identical.
- **Simpler exports**: The export engine injects sanitized session data and manifest JSON (after running `SanitizeForExport()` to physically remove deleted content and normalize paths). The export viewer applies remaining edits at render time, just like the SPA.

If an edit isn't showing up, debug the frontend transform code, not the backend.

**Key file references:** `web/src/manifest/sessionTransform.ts` (`applyManifest()`), `internal/api/handlers_manifest.go` (manifest API handlers), `internal/export/engine.go` (data injection).

---

### 13. What happens to deleted content during export?

Deleted content gets a stronger guarantee during export than in the live app. In the SPA, deleted blocks are hidden by CSS but still present in the data (they can be toggled visible). During export, deleted content is **physically removed** so it cannot be recovered from the exported HTML even via browser dev tools.

The export engine runs a three-stage PII sanitization pipeline in `SanitizeForExport()` (`internal/export/sanitize.go`):

1. **Apply delete edits server-side**: Collects all block IDs targeted by `delete` edits and physically removes those messages from the session data. Delete edits are then stripped from the exported manifest since they've already been applied.

2. **Strip sensitive metadata**: Removes `FilePath` (absolute path to JSONL file) and `ProjectDir` from session metadata. Truncates `ProjectName` to the leaf directory name only.

3. **Normalize home directory paths**: Replaces OS-specific home paths (`C:\Users\<name>\`, `/home/<name>/`, `/Users/<name>/`) with `~/` across all message content, tool results, tool use inputs, and structured patches.

**Key file references:** `internal/export/sanitize.go` (`SanitizeForExport()`, three-stage pipeline), `internal/export/engine.go` (overall export flow).

---

## Export Engine

### 14. How does single-file HTML export work?

The export pipeline has three stages:

**Build the template.** `npm run build:export` processes `web/export.html` through `vite-plugin-singlefile`, inlining all JavaScript and CSS into a single HTML file at `web/dist-export/export.html`. This file contains a placeholder: `window.__CHRONICLE_DATA__={}`.

**Inject the data.** At export time, the Go engine (`internal/export/engine.go`) loads the embedded template (via `embed.go`) and does a string replacement, swapping the empty `{}` placeholder with the full session JSON payload (session + manifest + theme). It also sets the `data-theme` attribute for the chosen theme.

**Render.** When opened in a browser, `export-main.tsx` reads `window.__CHRONICLE_DATA__` and the `ExportViewer` component renders the session using the same shared components as the live SPA. Manifest edits are applied client-side by `sessionTransform.ts`.

The placeholder string `window.__CHRONICLE_DATA__={}` is a hard-coded contract. If it's missing or changed, exports silently produce empty pages.

**Key file references:** `web/vite.config.export.ts` (single-file build), `web/export.html` (template with placeholder), `internal/export/engine.go` (string replacement), `web/src/export-main.tsx` (data reading), `embed.go` (template embedding).

---

### 15. What PII sanitization happens during export?

See [question 13](#13-what-happens-to-deleted-content-during-export) for the full three-stage pipeline. In summary:

1. Deleted content is physically removed (not just hidden).
2. Absolute file paths and project directories are stripped from metadata.
3. Home directory paths are normalized to `~/` across all message content.

The sanitization logic lives in `internal/export/sanitize.go`. Home path detection uses a regex that matches Windows (`C:\Users\<name>\`), Linux (`/home/<name>/`), and macOS (`/Users/<name>/`) formats, handling both forward and backslash separators.

**Key file references:** `internal/export/sanitize.go`.

---

## Real-time Updates

### 16. How does the app update when session files change on disk?

A three-component pipeline connects filesystem changes to UI updates:

**Filesystem watcher** (`internal/watcher/watcher.go`): Uses `fsnotify` to monitor `~/.claude/projects/`. Watches both the root directory (for new/deleted project subdirectories) and each project subdirectory (for JSONL file changes). Events are debounced with a 500ms window — rapid filesystem changes are batched into a single notification. Accumulated events are classified as either `SessionsChanged` (structural: creates, deletes, renames) or `SessionUpdated` (content: writes to an existing file, includes the session ID).

**SSE hub** (`internal/api/hub.go`): A pub/sub broadcaster. Connected clients register via `addClient()` and receive events on a buffered channel. Broadcasting is non-blocking — if a client's buffer is full, the event is dropped (the client catches up on the next one).

**SSE handler** (`internal/api/handlers_sse.go`): Serves `GET /api/events` as a Server-Sent Events stream. Each connected browser tab registers with the hub and receives events formatted as JSON (`sessions_changed` or `session_updated`). The frontend listens on this stream and refetches data as needed.

When the watcher fires, the server also invalidates the session discovery cache so the next API call returns fresh data.

Watcher failure is non-fatal — the server logs a warning and continues without real-time updates.

**Key file references:** `internal/watcher/watcher.go`, `internal/api/hub.go`, `internal/api/handlers_sse.go`, `internal/api/server.go` (`StartWatching()`).

---

## Testing

### 17. What are "smoke tests" and how do they differ from unit tests?

Smoke tests verify the core pipeline works with **real-world session data**, catching unexpected data shapes that factory-built test data never produces. They operate at three levels:

1. **Fixture generation** (`make smoke-fixtures`): The `dump-fixtures` CLI command (`cmd/chronicle/main.go`) walks `~/.claude/projects/`, collects the 50 newest JSONL files (up to 10MB each), truncates long sessions to first 100 + last 100 messages, and outputs JSON fixtures to `web/src/test/fixtures/smoke/`.

2. **Go parsing** (`make smoke-go`): `internal/session/smoke_test.go` runs `TestSmokeParseRealSessions`, which parses real JSONL files from disk and verifies they survive a JSON round-trip (parse, marshal, unmarshal). Skips gracefully if no real sessions exist.

3. **Frontend rendering** (`make smoke-web`): `web/src/session/SessionViewer.smoke.test.tsx` loads the generated fixtures and renders each through `SessionViewer` in both Claude and Copilot themes, verifying nothing crashes. Skips if fixtures don't exist.

Unit tests use factory-built data with predictable structure. Smoke tests use real data with all its messy edge cases. Run `make smoke` to execute all three levels.

**Key file references:** `Makefile` (`smoke`, `smoke-fixtures`, `smoke-go`, `smoke-web` targets), `cmd/chronicle/main.go` (`dump-fixtures` command), `internal/session/smoke_test.go`, `web/src/session/SessionViewer.smoke.test.tsx`.

---

### 18. How does the test factory system work?

The factory module (`web/src/test/factories.ts`) provides builder functions for all test data types. Each builder returns a complete object with sensible defaults, accepting an optional `overrides` parameter (spread via `Partial<T>`) to customize specific fields.

A global counter with `nextId()` generates deterministic, auto-incrementing IDs (`test-id-1`, `test-id-2`, etc.). `resetIdCounter()` resets it for test isolation.

Available builders include: `createContentBlock()`, `createToolResult()`, `createToolUseResultData()`, `createMessage()`, `createUserMessage()`, `createParsedSession()`, `createSessionInfo()`, `createManifest()`, `createDeleteEdit()`, `createCollapseEdit()`, `createAnnotateEdit()`, `createEditTextEdit()`, and `createMetadata()`.

These factories are used by both Vitest tests and Storybook stories, ensuring consistent test data across the codebase.

**Key file references:** `web/src/test/factories.ts`.

---

## CI/CD & Releases

### 19. How do releases get versioned and published?

Releases use a two-job chained workflow (`.github/workflows/release-please.yml`):

**Job 1 — release-please**: Runs on main branch pushes. Parses conventional commit messages to auto-generate `CHANGELOG.md` and create release PRs. Pre-1.0 versioning: `feat` and `fix` both bump patch; breaking changes (`feat!:`, `fix!:`) bump minor. Configuration lives in `.github/release-please-config.json`.

**Job 2 — GoReleaser**: Runs only when release-please creates a release. Builds cross-platform binaries (linux/darwin/windows, amd64/arm64), packages them as tar.gz (Unix) or zip (Windows), and attaches them to the GitHub release. Also exports a demo HTML file and includes it in the release.

Both jobs run in the same workflow to avoid a GitHub limitation where tags created by `GITHUB_TOKEN` don't trigger other workflows.

Version variables (`version`, `commit`, `date`, `branch`) in `cmd/chronicle/main.go` are injected via Go ldflags. GoReleaser sets `version`, `commit`, and `date` automatically; the Makefile sets `version` and `branch`.

**Key file references:** `.github/workflows/release-please.yml`, `.github/release-please-config.json`, `.github/.goreleaser.yml`, `cmd/chronicle/main.go` (version variables).

---

### 20. How does the GitHub Pages demo pipeline work?

The CI workflow (`.github/workflows/ci.yml`) builds and deploys demo content to GitHub Pages on pushes to main and on pull requests:

1. **Export demos**: Exports `samples/sample_session.jsonl` as HTML in both Claude and Copilot themes. The Copilot export is used for showcase screenshots but only the Claude-theme demo is included in the final deployment.
2. **Build Storybook**: Compiles the static Storybook site.
3. **Capture screenshots**: Uses Playwright to screenshot Storybook stories and generate a gallery page.
4. **Generate showcase**: Captures before/after screenshots of demo exports and generates a landing page.
5. **Deploy**: Publishes everything to the `jgbright/claude-chronicle-demo` repo's `gh-pages` branch using `peaceiris/actions-gh-pages@v4` with `keep_files: true` so previous versions remain accessible.

**URL structure**: Main pushes publish to `{short-sha}/` and update `index.html`. PR builds publish to `pr-{number}/`. CI auto-comments on PRs with preview URLs linking to the landing page, demo exports, and Storybook gallery.

**Key file references:** `.github/workflows/ci.yml` (export, screenshot, deploy steps), `web/package.json` (`capture-screenshots`, `generate-gallery`, `capture-showcase`, `generate-showcase` scripts).

---

## Conventions & Guardrails

### 21. Why must I never modify `~/.claude/`?

`~/.claude/` is Claude Code's data directory. Session JSONL files there are the canonical conversation records. Chronicle treats them as **read-only** — it reads session data but never writes, renames, or deletes anything in that directory.

All Chronicle-specific data (manifests, metadata overrides, soft-delete flags) lives under `~/.claude-chronicle/`. This separation means:

- Uninstalling Chronicle leaves Claude Code's data untouched.
- No risk of corrupting session files through a Chronicle bug.
- Multiple tools can safely read `~/.claude/` concurrently.

The `CHRONICLE_DATA_DIR` environment variable overrides where Chronicle *reads* sessions from, but it doesn't change this read-only constraint.

**Key file references:** `internal/manifest/storage.go` (writes to `~/.claude-chronicle/`), `internal/session/discovery.go` (reads from `~/.claude/projects/`).

---

### 22. How should I write commit messages?

Use conventional commit prefixes. release-please parses them to auto-generate the changelog and determine version bumps.

**Changelog-visible types** (the first line becomes a release note):
- `feat:` — Features (patch bump pre-1.0)
- `fix:` — Bug Fixes (patch bump)
- `feat!:` / `fix!:` — Breaking Changes (minor bump pre-1.0)

**Changelog-invisible types** (never appear in changelog, don't trigger releases):
- `chore:`, `docs:`, `ci:`, `build:`, `test:`, `refactor:`, `perf:`

**Guidelines:**
- Write the first line for someone reading release notes, not reviewing code.
- Describe the user-visible change: "add single-file HTML export" not "add export engine with template injection."
- Lowercase after the prefix: `feat: add ...` not `feat: Add ...`.
- Keep the first line under ~70 characters. Use the commit body for technical details.
- The commit body does NOT appear in the changelog. Include one when it adds useful context (reasoning, trade-offs, alternatives).

**Key file references:** `.claude/CLAUDE.md` (commit conventions section), `.github/release-please-config.json`.

