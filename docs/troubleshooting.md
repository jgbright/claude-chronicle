# Troubleshooting (Engineering)

Non-obvious troubleshooting and implementation questions for contributors.

For setup and day-to-day workflow, use [contributors.md](contributors.md).
For system walkthroughs, use [architecture.md](architecture.md) and [data-flow.md](data-flow.md).

## Build and Runtime Gotchas

### Why does `go build` or `go test ./...` fail with embed errors?

`embed.go` requires `web/dist/` and `web/dist-export/export.html` at compile time.

Run:

```bash
make web-build
go test ./...
```

or:

```bash
make build
```

### Why do frontend changes not appear in dev mode?

`serve -dev` expects Vite running separately.

Run in two terminals:

```bash
cd web && npm run dev
go run ./cmd/chronicle serve -dev
```

If Vite uses a different port, pass `-dev-url`.

### Why can the server start on a different port than `:8080`?

If the requested port is busy and `-strict` is not set, Chronicle auto-falls back to the next available port.

Use `-strict` to fail instead of fallback.

## Data and Manifest Behavior

### Why are manifests applied client-side instead of server-side?

Chronicle keeps the Go backend thin and applies edits in `web/src/manifest/sessionTransform.ts` for both SPA and export rendering. This guarantees preview/export parity with one transform implementation.

### What happens to deleted content during export?

During export, delete edits are applied server-side and removed from payload data, so deleted content is physically absent from exported HTML.

See: `internal/export/sanitize.go`.

### Why must we never modify `~/.claude/`?

`~/.claude/` is treated as read-only source data. Chronicle stores its own state in `~/.claude-chronicle/` so curation is non-destructive and reversible.

## Parsing and Sync Pitfalls

### Why is `message.content` polymorphic in parsing?

Claude session records can represent content as either a JSON string or an array of content blocks. Parser code handles both via `json.RawMessage`.

See: `internal/session/parser.go`.

### How are multi-record assistant responses merged?

Assistant records with the same `message.id` are merged into one rendered message by appending blocks in arrival order.

See: `internal/session/parser.go` (`mergeRecords`).

### How do live updates from filesystem changes reach the UI?

Pipeline:
1. `fsnotify` watcher classifies file events
2. API hub broadcasts SSE events
3. Frontend listens on `/api/events` and refetches as needed

See: `internal/watcher/watcher.go`, `internal/api/hub.go`, `internal/api/handlers_sse.go`.

## Testing and Releases

### What are smoke tests and when should I run them?

Smoke tests validate real-session shapes across Go parsing and frontend rendering.

Run:

```bash
make smoke
```

Use this before release-oriented changes in parsing, manifest transform, or rendering.

### Which commit types trigger release automation?

`feat:` and `fix:` drive release-please release notes and version bumps.
Other types (`docs:`, `chore:`, `test:`) do not trigger releases by themselves.

See: `.github/release-please-config.json`.
