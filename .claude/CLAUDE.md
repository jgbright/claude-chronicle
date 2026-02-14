# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Claude Chronicle — tool for curating and sharing Claude Code sessions as polished static sites. Single Go binary with an embedded React SPA frontend.

## Prerequisites

Go 1.25+ and Node.js 18+.

## Build & Run

```bash
# Full build (web assets + Go binary)
make build                         # VERSION defaults to "dev"
make build VERSION=0.2.0           # Set version string

# Development (two terminals)
cd web && npm run dev              # Terminal 1: Vite dev server (port 5173)
go run ./cmd/chronicle serve -dev  # Terminal 2: Go server proxying to Vite

# CLI
./claude-chronicle.exe serve           # Serves on :8080 (auto-finds open port), auto-opens browser
./claude-chronicle.exe list            # List discovered sessions
./claude-chronicle.exe export -session <id> -theme copilot -o out.html
./claude-chronicle.exe export -file path/to/session.jsonl -o out.html
./claude-chronicle.exe dump-fixtures       # Generate JSON fixtures from real sessions (smoke tests)
./claude-chronicle.exe version         # Print version info

# Web only
cd web && npm install              # Install dependencies
cd web && npm run build            # Build SPA (web/dist/)
cd web && npm run build:export     # Build export template (web/dist-export/)
cd web && npm run lint             # ESLint
cd web && npm test                 # Run Vitest frontend tests

# Storybook
cd web && npm run storybook        # Dev server on port 6006
cd web && npm run build-storybook  # Static build → storybook-static/
```

**Makefile shortcuts**: `make test` (all tests), `make lint` (go vet + ESLint), `make clean`, `make dev` (Go server in dev mode), `make smoke` (parse real sessions and render through frontend).

**Go tests**: `go test ./internal/session/`, `go test ./internal/manifest/`, `go test ./internal/export/`, `go test ./internal/api/`, `go test ./cmd/chronicle/`. Run individual packages to avoid embed issues, or `go test ./...` after `make web-build`. **Frontend tests**: `cd web && npm test` — Vitest + React Testing Library, tests in `web/src/**/*.test.{ts,tsx}`. Run a single test file: `cd web && npx vitest run src/manifest/sessionTransform.test.ts`.

**Build dependency**: `go build` requires `web/dist/` and `web/dist-export/export.html` to exist because `embed.go` has `//go:embed` directives for both. Always run `make web-build` (or `make build`) before `go build`.

**Coverage**: `go test -race -coverprofile=coverage.out ./...` (Go), `cd web && npm run test:coverage` (frontend, output in `web/coverage/`). CI uploads both to Codecov.

**Environment variable**: `CHRONICLE_DATA_DIR` overrides the default session discovery path (`~/.claude/projects/`). Useful for testing with a custom data directory: `CHRONICLE_DATA_DIR=/tmp/test-sessions go run ./cmd/chronicle serve`.

## Architecture

### Go Backend (`cmd/`, `internal/`, `embed.go`)

- **Session discovery & parsing** (`internal/session/`): Reads JSONL files from `~/.claude/projects/*/`. Assistant records sharing the same `message.id` are merged into a single logical message with all content blocks. Includes content search (`search.go`) for filtering sessions by text query.
- **Manifest system** (`internal/manifest/`): Non-destructive edit layer stored in `~/.claude-chronicle/manifests/`. Edit types: `delete` (remove a block), `collapse` (group blocks into a summary), `annotate` (insert commentary after a block), `editText`, `reorder`. Manifests also carry optional `Metadata` (`Title`, `Deleted`) for persistent session-level overrides. The API list/get handlers merge manifest metadata into session info before returning. Soft-deleted sessions (`Deleted: true`) are hidden by default; pass `?deleted=true` to include them.
- **API server** (`internal/api/`): Go 1.25+ `http.ServeMux` with method routing. SPA fallback for client-side routing. Dev mode proxies to Vite. Includes an SSE hub (`hub.go`) for broadcasting real-time events to connected clients.
- **Filesystem watcher** (`internal/watcher/`): Monitors `~/.claude/projects/` with `fsnotify`, debounces changes (500ms), and pushes `sessions_changed`/`session_updated` events via the SSE hub. Watcher failure is non-fatal — logs a warning but doesn't block startup.
- **Export engine** (`internal/export/`): Injects session JSON into single-file HTML template via `window.__CHRONICLE_DATA__` string replacement. Includes a three-stage PII sanitization pipeline (`sanitize.go`): (1) server-side application of manifest delete edits to physically remove deleted content, (2) stripping `FilePath`/`ProjectDir` from session metadata, (3) normalizing home directory paths to `~/` across all message content, tool results, and structured patches.

### React Frontend (`web/src/`)

- **Directory layout**: `session/` (API, hooks, UI components), `manifest/` (API, types, sessionTransform), `shared/` (utilities + rendering primitives), `shell/` (App, Toolbar, sidebar), `themes/` (registry, context, per-theme components), `hooks/` (shared React hooks like `useDeferredLoading`), `export/` (export viewer), `test/` (factories).
- **Two entry points**: `main.tsx` (SPA, fetches from API) and `export-main.tsx` (reads `window.__CHRONICLE_DATA__`, read-only)
- **Two Vite configs**: `vite.config.ts` (SPA build) and `vite.config.export.ts` (single-file build via `vite-plugin-singlefile`)
- **Theme component dispatch** (`themes/`): Each theme (Claude, Copilot) provides its own `Wrapper`, `MessageBlock`, `AnnotationBlock`, and `CollapsedGroup` implementations. `ThemeComponents.ts` defines the `ThemeComponentSet` interface; `ThemeContext.ts` provides the React Context + `useThemeComponents()` hook; `registry.ts` maps theme names to component sets. `SessionViewer` calls `useThemeComponents()` to render with the active theme's components.
- **Shared rendering primitives** (`shared/`): `CodeBlock`, `MarkdownContent`, and `ToolUseBlock` are imported by both Claude and Copilot theme components.
- **Theme CSS**: `themes/tokens.css` defines CSS custom properties; `claude/claude.css` and `copilot/copilot.css` override them. Controlled by `data-theme` attribute on `<html>` (set by `themes/useTheme.ts`).
- **Manifest application**: `manifest/sessionTransform.ts` applies manifest edits client-side for both live preview (SPA) and static exports.
- **View-state layer** (`session/BulkCollapseContext.ts`): Ephemeral UI state (bulk collapse thinking/tool-results) managed via React Context. Separate from persistent manifest edits — does not pollute undo/redo, resets on session switch.

### API Routes

```
GET    /api/projects                              # List projects with session counts
GET    /api/sessions                              # List all sessions (?q=, ?project=, ?deleted=true)
GET    /api/sessions/{id}                         # Get parsed session + manifest
GET    /api/sessions/{id}/manifest                # Get edit manifest
PUT    /api/sessions/{id}/manifest                # Replace manifest
POST   /api/sessions/{id}/manifest/edits          # Append an edit
DELETE /api/sessions/{id}/manifest/edits/{index}  # Remove edit by index
PATCH  /api/sessions/{id}/manifest/metadata       # Update manifest metadata (title)
POST   /api/sessions/{id}/reveal                  # Open file in OS file explorer
POST   /api/sessions/{id}/export                  # Download exported HTML
GET    /api/events                                 # SSE stream (sessions_changed, session_updated)
```

## CI/CD & Releases

- **CI** (`.github/workflows/ci.yml`): Builds, lints, and tests on PRs and main pushes. Uploads binary as artifact. Exports demo sessions, captures theme screenshots, builds the Astro landing site (`site/`), and deploys to the `gh-pages` branch on the same repo (`jgbright.github.io/claude-chronicle/`). Main pushes deploy the full site: Astro landing page at `/`, demo at `/demo/`, HTML coverage reports at `/coverage/go/` and `/coverage/frontend/`, Storybook gallery at `/storybook/`, plus a `{short-sha}/demo.html` permalink. PR builds only deploy `pr-{number}/demo.html`. All files persist via `keep_files: true`.
- **release-please + GoReleaser** (`.github/workflows/release-please.yml`): Single workflow with two chained jobs. First job runs release-please to auto-create release PRs from conventional commits (pre-1.0: `feat` and `fix` both bump patch; breaking changes bump minor). Second job runs GoReleaser to build cross-platform binaries (linux/darwin/windows, amd64/arm64) — only when a release is created. Both jobs run in the same workflow to avoid the GitHub limitation where tags created by `GITHUB_TOKEN` don't trigger other workflows.
- **Versioning**: `version`, `commit`, `date` variables in `cmd/chronicle/main.go` are injected via ldflags. GoReleaser sets all three automatically; the Makefile only sets `version`.

### Commit message conventions

Conventional commit prefixes are required. release-please parses them to auto-generate `CHANGELOG.md` and determine version bumps.

**Changelog-visible types** — the first line becomes a bullet in the changelog, so write it for end users:
- `feat:` → appears under **Features**, triggers a patch bump (pre-1.0)
- `fix:` → appears under **Bug Fixes**, triggers a patch bump
- `feat!:` / `fix!:` → appears under **Breaking Changes**, triggers a minor bump (pre-1.0)

**Changelog-invisible types** — these never appear in the changelog and don't trigger releases:
- `chore:`, `docs:`, `ci:`, `build:`, `test:`, `refactor:`, `perf:`

**Writing good commit messages:**
- The first line after the prefix is the changelog entry — write it for someone reading release notes, not reviewing code.
- Describe the user-visible change, not the implementation. Prefer "add single-file HTML export" over "add export engine with template injection."
- Use lowercase after the prefix: `feat: add ...` not `feat: Add ...`.
- Scopes are optional but help organize: `fix(export): handle empty sessions`.
- Keep the first line under ~70 characters. Use the commit body for technical details.
- The commit body does NOT appear in the changelog — only the first line does.
- Include a body when it adds useful context — why it was done, trade-offs, alternatives considered, or anything that helps a future reviewer understand the reasoning. Not every commit needs one, but most non-trivial changes benefit from it.

## Key Patterns

- **JSONL parsing quirk**: `content` field in user records can be either a plain string or a `[]ContentBlock` array. Parser handles both via `json.RawMessage`.
- **Project name decoding**: Directory names like `D--repos-claude-chronicle` are decoded back to paths (`D:/repos/claude-chronicle`) in `discovery.go`.
- **Cross-platform**: Uses `USERPROFILE` on Windows, `HOME` on Unix for locating `~/.claude/`.
- **Never modify `~/.claude/`**: All Chronicle data (manifests) lives in `~/.claude-chronicle/`.
- **Embed requires web build**: The `embed.go` file at the repo root embeds `web/dist/*` and `web/dist-export/export.html`. Go compilation fails if these directories don't exist.
- **Manifest application is client-side only — with one exception**: `manifest/sessionTransform.ts` applies manifest edits in the browser. The Go backend stores and serves manifests but does not apply them — the export engine injects raw session + manifest JSON and lets the frontend handle it. **Exception**: during export, `SanitizeForExport()` applies delete edits server-side to physically remove deleted content from the exported HTML (privacy guarantee — deleted content must not be recoverable from exports even via browser dev tools).
- **Export template placeholder**: The export HTML template must contain the exact string `window.__CHRONICLE_DATA__={}`. The Go export engine does a simple string replacement to inject session JSON. If this placeholder is missing or changed, exports will silently produce empty data.
- **Export `-file` flag**: The `export` command accepts `-file <path>` to export any JSONL file directly, bypassing session discovery and manifests. Used by CI to export `samples/demo-session.jsonl` for GitHub Pages.
- **Manifest edit ordering**: Edits in the manifest array are applied sequentially. Order matters when edits interact (e.g., a collapse referencing a block that was deleted by an earlier edit).
- **Test factories**: `web/src/test/factories.ts` provides builders for all test data (`createMessage`, `createParsedSession`, `createDeleteEdit`, etc.) with auto-incrementing deterministic IDs. Used by both Vitest tests and Storybook stories.
- **Storybook + screenshot pipeline**: Stories in `web/src/**/*.stories.tsx` cover shared and per-theme components. CI builds Storybook, captures Playwright screenshots (`npm run capture-screenshots`), generates a self-contained gallery (`npm run generate-gallery`), and deploys to GitHub Pages alongside the demo export.
- **AI docs**: `.claude/CLAUDE.md` is the single source of truth. `AGENTS.md` (OpenAI Codex) is generated from it by `.codex/setup-cloud-container.sh`/`.codex/maintain-cloud-container.sh` and gitignored.

## Non-Goals

- **No multi-user collaboration or authentication** — Chronicle is a single-user local tool.
- **No mutation of `~/.claude/`** — session files are read-only. All Chronicle data lives under `~/.claude-chronicle/`.
- **No cloud/remote deployment** — session data contains sensitive conversation content. The local-only constraint is a feature. (`CHRONICLE_DATA_DIR` overrides the local data directory, not deployment topology.)
- **No server-side manifest application** — manifests are applied client-side in the browser. **Exception**: during export, `SanitizeForExport()` applies delete edits server-side to physically remove deleted content (privacy guarantee).
