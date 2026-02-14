# Getting Started

This guide walks you through building, running, and developing Claude Chronicle.

## Prerequisites

| Tool    | Minimum Version | Notes                                    |
|---------|-----------------|------------------------------------------|
| Go      | 1.25.7          | See `go.mod`                             |
| Node.js | 18+             | Required for Vite 7.x and the React build |
| npm     | 9+              | Comes with Node.js                       |
| Make    | Any             | GNU Make or compatible                   |

## Quick Start

Build and run in two commands:

```bash
make build
./claude-chronicle.exe serve
```

This will:

1. Install npm dependencies (`cd web && npm install`)
2. Build the React SPA into `web/dist/`
3. Build the single-file export template into `web/dist-export/export.html`
4. Compile the Go binary with embedded web assets
5. Start the server on `http://localhost:8080` and open your browser

You should see output like:

```
Claude Chronicle server starting on :8080
```

The web UI will load in your browser showing any Claude Code sessions discovered in `~/.claude/projects/`.

## Development Workflow

For active development, use a two-terminal setup with hot reload:

**Terminal 1** -- Vite dev server (frontend):

```bash
cd web && npm install && npm run dev
```

This starts the Vite dev server on `http://localhost:5173` with hot module replacement. Editing any React component, CSS, or TypeScript file will instantly update in the browser.

**Terminal 2** -- Go backend:

```bash
go run ./cmd/chronicle serve -dev
```

The `-dev` flag tells the Go server to proxy all frontend requests to the Vite dev server at `localhost:5173` instead of serving the embedded static files. API requests (`/api/*`) are handled by Go as usual.

This means you get:
- **Hot reload** for all frontend changes (no rebuild needed)
- **Live Go server** for API development (restart Terminal 2 to pick up Go changes)
- The browser auto-open is skipped in dev mode; navigate to `http://localhost:8080` manually

### Serve command options

```
-addr    Listen address (default ":8080")
-dev     Development mode -- proxy to Vite
-dev-url Vite dev server URL (default "http://localhost:5173")
-strict  Fail if the requested port is unavailable (no auto-fallback)
```

## Build Commands

| Command                          | What it does                                                   |
|----------------------------------|----------------------------------------------------------------|
| `make build`                     | Full build: web assets + Go binary (version defaults to "dev") |
| `make build VERSION=0.2.0`      | Full build with a specific version string                      |
| `make web-build`                 | Build only the web assets (SPA + export template)              |
| `make web-install`               | Install npm dependencies only                                  |
| `make clean`                     | Remove build artifacts (`claude-chronicle.exe`, `web/dist/`, `web/dist-export/`) |
| `cd web && npm run build`        | Build the SPA only (`web/dist/`)                               |
| `cd web && npm run build:export` | Build the export template only (`web/dist-export/`)            |
| `cd web && npm run lint`         | Run ESLint on frontend code                                    |

## Running Tests

### Go tests

Run individual packages to avoid embed-related build errors:

```bash
go test ./internal/session/
go test ./internal/manifest/
go test ./internal/export/
go test ./internal/api/
go test ./cmd/chronicle/
```

If you have already built the web assets (`make web-build`), you can run all Go tests at once:

```bash
go test ./...
```

The `embed.go` file at the repo root requires `web/dist/` and `web/dist-export/export.html` to exist at compile time. Running `go test ./...` without them will fail with embed errors.

### Frontend tests

```bash
cd web && npm test
```

This runs Vitest with React Testing Library. To run a single test file:

```bash
cd web && npx vitest run src/manifest/sessionTransform.test.ts
```

## CLI Commands

Claude Chronicle provides five commands:

### `serve` -- Start the web viewer

```bash
./claude-chronicle.exe serve
./claude-chronicle.exe serve -addr :3000       # custom port
./claude-chronicle.exe serve -dev              # development mode
```

### `list` -- List discovered sessions

```bash
./claude-chronicle.exe list
```

Outputs a table of all sessions found in `~/.claude/projects/`:

```
ID          PROJECT                     MODIFIED  SIZE
a1b2c3d4..  D:/repos/claude-chronicle   2h ago    145.3 KB
e5f6g7h8..  D:/repos/other-project      1d ago    82.1 KB
```

### `export` -- Export a session to a standalone HTML file

```bash
# Export by session ID (discovered from ~/.claude/projects/)
./claude-chronicle.exe export -session a1b2c3d4 -o output.html

# Export any JSONL file directly (bypasses discovery and manifests)
./claude-chronicle.exe export -file path/to/session.jsonl -o output.html

# Choose a theme (claude or copilot)
./claude-chronicle.exe export -session a1b2c3d4 -theme copilot -o output.html
```

If `-o` is omitted, the output file defaults to `chronicle-<id>.html`.

### `dump-fixtures` -- Generate smoke-test fixtures from real sessions

```bash
# Use default Claude projects dir (~/.claude/projects/)
./claude-chronicle.exe dump-fixtures

# Override input dir and output dir
./claude-chronicle.exe dump-fixtures -dir D:/path/to/projects -out web/src/test/fixtures/smoke -max 50
```

### `version` -- Print version info

```bash
./claude-chronicle.exe version
# claude-chronicle dev (commit: none, built: unknown)
```

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `cannot find package` or `pattern web/dist/*: no matching files found` during `go build` or `go test` | The `embed.go` directives require built web assets | Run `make web-build` before `go build` or `go test ./...` |
| `bind: address already in use` on serve | In `-strict` mode, Chronicle does not auto-fallback to the next port | Omit `-strict` to allow automatic fallback (up to 10 ports), or pick a free port with `-addr` |
| `Cannot find module` or missing dependencies in `web/` | npm packages not installed | Run `cd web && npm install` |
| Vite dev server not reachable in `-dev` mode | Terminal 1 is not running or is on a different port | Start `cd web && npm run dev` in another terminal; use `-dev-url` if the port differs |
| `go test ./...` fails but individual packages pass | Embed errors from the root package | Run `make web-build` first, then `go test ./...` works |
