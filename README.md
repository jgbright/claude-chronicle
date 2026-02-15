# Claude Chronicle

[![CI](https://github.com/jgbright/claude-chronicle/actions/workflows/ci.yml/badge.svg)](https://github.com/jgbright/claude-chronicle/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/jgbright/claude-chronicle/graph/badge.svg)](https://codecov.io/gh/jgbright/claude-chronicle)
[![GitHub release](https://img.shields.io/github/v/release/jgbright/claude-chronicle)](https://github.com/jgbright/claude-chronicle/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Turn your [Claude Code](https://claude.ai/code) sessions into shareable walkthroughs.

Working with Claude Code is a collaborative process — you prompt, steer, correct course, and build something together. But when the session is over, all that context lives in a raw log that's hard for anyone else to follow. Chronicle lets you turn those sessions into something you can share: a narrated, curated record of what happened and why.

Think of it like a Loom recording for your AI sessions. You pick a session, trim the noise, collapse the parts that don't matter, add annotations explaining your thinking — why you prompted a certain way, what you were steering toward, what you'd do differently — and export a single HTML file you can send to anyone.

**[Live Demo](https://jgbright.github.io/claude-chronicle/demo/)** — see an exported session in action.

## Features

- **Session discovery** — automatically finds sessions from `~/.claude/projects/`
- **Non-destructive editing** — delete blocks, collapse ranges, add commentary without modifying the original session
- **Static export** — single self-contained HTML file, no server needed to view
- **Single binary** — local Go binary with the React frontend embedded
- **Rich rendering** — syntax-highlighted code, collapsible tool calls and thinking blocks, file diffs
- **Annotations** — add your own narrative to explain prompting decisions, highlight what worked, or call out lessons learned
- **Dual themes** — Claude (warm/light) and Copilot (dark)

## Quick Start

### Install

Download a pre-built binary from the [Releases](https://github.com/jgbright/claude-chronicle/releases) page.
If the latest release does not include binary assets yet, use the Go-based install option below.

Linux (amd64):

```bash
curl -fL https://github.com/jgbright/claude-chronicle/releases/latest/download/claude-chronicle_linux_amd64.tar.gz | tar xz
./claude-chronicle version
```

Linux (arm64):

```bash
curl -fL https://github.com/jgbright/claude-chronicle/releases/latest/download/claude-chronicle_linux_arm64.tar.gz | tar xz
./claude-chronicle version
```

macOS (Apple Silicon / arm64):

```bash
curl -fL https://github.com/jgbright/claude-chronicle/releases/latest/download/claude-chronicle_darwin_arm64.tar.gz | tar xz
./claude-chronicle version
```

macOS (Intel / amd64):

```bash
curl -fL https://github.com/jgbright/claude-chronicle/releases/latest/download/claude-chronicle_darwin_amd64.tar.gz | tar xz
./claude-chronicle version
```

Windows PowerShell (amd64):

```powershell
curl.exe -fL https://github.com/jgbright/claude-chronicle/releases/latest/download/claude-chronicle_windows_amd64.zip | tar -x -f -
.\claude-chronicle.exe version
```

Windows PowerShell (arm64):

```powershell
curl.exe -fL https://github.com/jgbright/claude-chronicle/releases/latest/download/claude-chronicle_windows_arm64.zip | tar -x -f -
.\claude-chronicle.exe version
```

These PowerShell commands stream the archive directly to `tar` so no temporary zip file is kept on disk.

If release binaries are unavailable, use one of the Go-based options below.

Alternative (separate option): auto-detect OS/arch on Linux/macOS:

```bash
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)
[ "$ARCH" = "x86_64" ] && ARCH=amd64
[ "$ARCH" = "aarch64" ] && ARCH=arm64
curl -fL "https://github.com/jgbright/claude-chronicle/releases/latest/download/claude-chronicle_${OS}_${ARCH}.tar.gz" | tar xz
./claude-chronicle version
```

### Run directly with Go (no manual release download)

Install the CLI from source:

```bash
go install github.com/jgbright/claude-chronicle/cmd/chronicle@latest
chronicle version
```

Run once without installing:

```bash
go run github.com/jgbright/claude-chronicle/cmd/chronicle@latest serve
```

### Build from source

Requires [Go](https://go.dev/) 1.25+ and [Node.js](https://nodejs.org/) 18+.

```bash
make build
```

This installs web dependencies, builds the React SPA and export template, then compiles everything into a single `claude-chronicle` binary.

### Run

```bash
# Launch the web viewer (opens browser automatically)
./claude-chronicle serve

# List discovered sessions
./claude-chronicle list

# Export a session to a standalone HTML file
./claude-chronicle export -session <id> -theme copilot -o session.html

# Export any JSONL file directly
./claude-chronicle export -file path/to/session.jsonl -o session.html
```

## How the Pipelines Work

Claude Chronicle has several interesting pipelines — the export pipeline that produces self-contained HTML files, the JSONL parsing pipeline that handles Claude Code's quirky data format, and a CI/CD chain that automates everything from preview deployments to cross-platform releases.

### The Export Pipeline

The headline feature: export any session as a single HTML file that works offline in any browser. This is a three-stage pipeline.

**Stage 1 — Build the template.** At build time, Vite compiles the React export viewer with [`vite-plugin-singlefile`](https://github.com/nicerapp/vite-plugin-singlefile), which inlines all JavaScript and CSS into one HTML file (`web/dist-export/export.html`). This template contains an empty data placeholder:

```html
<script>window.__CHRONICLE_DATA__={};</script>
```

At this point the template is a fully functional React app — it just has no data to render.

**Stage 2 — Sanitize and inject the data.** When you run `chronicle export`, the Go engine reads the JSONL session, parses and merges the records, loads any curation manifest, and runs the data through a three-stage PII sanitization pipeline: (1) manifest delete edits are applied server-side to physically remove deleted content, (2) sensitive metadata like `FilePath` and `ProjectDir` are stripped from session info, and (3) home directory paths (`C:\Users\name\`, `/home/name/`) are normalized to `~/` across all message content, tool results, and structured patches. The sanitized data is bundled into a JSON payload, then injected via string replacement — swapping the empty `{}` with the real data:

```go
html = strings.Replace(html,
    "window.__CHRONICLE_DATA__={}",
    "window.__CHRONICLE_DATA__="+string(jsonData), 1)
```

The template becomes a data-carrying document. Same HTML, same React code, but now with a complete session embedded.

**Stage 3 — Open in a browser.** The exported HTML file reads `window.__CHRONICLE_DATA__` at startup and renders the session using the same React components as the live app. Manifest edits (deletions, collapses, annotations) are applied client-side — the exact same `applyManifest()` function runs in both the live viewer and the export. What you see in the editor is what you get in the export.

The result is a fully portable HTML file, typically 200-500 KB, that renders a complete Claude Code conversation with syntax highlighting, collapsible tool calls, and themed styling. No server, no dependencies — just open the file.

### The JSONL Parsing Pipeline

Claude Code writes session data as JSONL files in `~/.claude/projects/`. The format has some quirks that make parsing non-trivial:

**Polymorphic content field.** The `content` field in user records can be either a plain JSON string (`"hello"`) or an array of content blocks (`[{"type": "tool_result", ...}]`). The parser uses `json.RawMessage` to defer deserialization, then tries both formats:

```go
// Try as string first
var textContent string
if err := json.Unmarshal(content, &textContent); err == nil {
    msg.TextContent = textContent
    return msg
}
// Try as array of content blocks
var blocks []ContentBlock
if err := json.Unmarshal(content, &blocks); err == nil {
    // extract tool_result blocks...
}
```

**Streamed assistant records.** A single assistant response can span multiple JSONL records — one for thinking, one for text, one for a tool call. Records sharing the same `message.id` are merged into a single message with all content blocks combined. The parser uses a map to track which message ID maps to which position in the output slice, appending new blocks as they arrive.

**Filtering.** Meta records, progress events, system commands, and sidechain messages are filtered out before merging, leaving a clean conversation ready for rendering.

### Non-Destructive Editing

All curation happens through a manifest system. Manifests are JSON files stored in `~/.claude-chronicle/manifests/` — Chronicle never touches Claude's data in `~/.claude/`. Five edit types are supported:

| Edit | What it does |
|------|-------------|
| **delete** | Remove a message from the rendered output |
| **collapse** | Group multiple messages into a single summary block |
| **annotate** | Insert your own commentary after a message |
| **editText** | Replace a message's text content |
| **reorder** | Move a message to a different position |

A deliberate design choice: the Go backend only stores manifests — it does not apply them for the live SPA. The same `applyManifest()` function in `sessionTransform.ts` runs client-side in both the live viewer and exported HTML files. The one exception is during export: `SanitizeForExport()` applies delete edits server-side to physically remove deleted content from the exported HTML, ensuring deleted messages can't be recovered even via browser dev tools.

### CI/CD: From Push to Release

Three GitHub Actions workflows chain together to automate building, testing, preview deployments, versioning, and cross-platform releases.

#### CI — build, test, and deploy previews

Every push to `main` and every PR triggers the [CI pipeline](.github/workflows/ci.yml). It runs frontend linting and tests in parallel with the full Go build-and-test cycle, uploads code coverage to Codecov, and builds a binary. But the interesting part is what happens next.

**The pipeline exports a demo session, builds an Astro landing site, and deploys everything to [GitHub Pages](https://jgbright.github.io/claude-chronicle/).** Main pushes deploy the full site: landing page at `/`, demo export at `/demo/`, HTML coverage reports at `/coverage/`, a static screenshot component gallery at `/component-gallery/`, and the full Storybook site at `/storybook/`. Each main push also creates a `{short-sha}/demo.html` permalink that never gets overwritten.

- **Pull requests** deploy only a `pr-{number}/demo.html` preview and the bot posts a comment with the URL.

All files persist across deployments (`keep_files: true`), so the site accumulates an archive of every build.

#### Release Please — automatic versioning

The [release-please workflow](.github/workflows/release-please.yml) scans every push to `main` for [conventional commit](https://www.conventionalcommits.org/) prefixes. When it finds `feat:` or `fix:` commits, it opens (or updates) a release PR that bumps the version and generates a changelog. The PR stays open and accumulates changes until you merge it — that's the only human action in the release process.

#### GoReleaser — cross-platform binaries

Merging the release PR creates a version tag, which triggers the GoReleaser job chained in the same [release-please workflow](.github/workflows/release-please.yml). GoReleaser builds the full pipeline — web assets, Go binary — for six targets:

| OS | Architectures |
|----|--------------|
| Linux | amd64, arm64 |
| macOS | amd64, arm64 |
| Windows | amd64, arm64 |

Each GitHub Release includes the six binaries (`.tar.gz` for Linux/macOS, `.zip` for Windows) plus an exported demo session HTML file. The full chain:

```
push feat:/fix: commits to main
  → release-please opens a release PR with changelog
  → merge the PR
  → version tag created (v0.x.y)
  → GoReleaser builds 6 binaries + demo HTML
  → GitHub Release published
```

## Architecture

```
cmd/chronicle/        CLI entry point (serve, list, export, version)
internal/
  session/            JSONL discovery and parsing
  manifest/           Non-destructive edit layer
  api/                HTTP API server
  export/             Single-file HTML export engine
embed.go              Embeds web assets into the Go binary at compile time
web/src/
  main.tsx            SPA entry point (fetches from API)
  export-main.tsx     Export entry point (reads window.__CHRONICLE_DATA__)
  manifest/           Manifest types and session transform logic
  shared/             Shared rendering primitives (CodeBlock, MarkdownContent, etc.)
  themes/             CSS custom properties (Claude + Copilot)
```

## Documentation

See [docs/](docs/) for detailed guides:

- [**Getting Started**](docs/GETTING-STARTED.md) — build, dev workflow, testing, CLI reference
- [**Architecture**](docs/ARCHITECTURE.md) — package relationships, key types, design decisions
- [**Data Flow**](docs/DATA-FLOW.md) — end-to-end trace from JSONL to rendered pixels
- [**FAQ**](docs/FAQ.md) — common questions for new contributors

## Development

Run the Go API server and Vite dev server side by side for hot-reload:

```bash
# Terminal 1: Vite dev server with HMR
cd web && npm run dev

# Terminal 2: Go server proxying non-API requests to Vite
go run ./cmd/chronicle serve -dev
```

The Go server runs on `:8080` and proxies frontend requests to Vite on `:5173`. See [Getting Started](docs/GETTING-STARTED.md) for the full development guide.

## AI Agent Environments

### OpenAI Codex

[`.codex/setup-cloud-container.sh`](.codex/setup-cloud-container.sh) installs Go, Node dependencies, and pre-builds the web assets so `go build` succeeds out of the box.

To use it in Codex:

1. Open your environment settings
2. Enable **Container caching** so dependencies persist between runs
3. **Setup script > Manual**: `bash .codex/setup-cloud-container.sh`
4. **Maintenance script > Manual**: `bash .codex/maintain-cloud-container.sh`

The setup script runs once when a new container is created (installs Go, Node deps, builds web assets). The maintenance script runs when a cached container is resumed on a new branch — it re-installs dependencies and rebuilds the frontend without reinstalling Go.

## License

MIT — see [LICENSE](LICENSE).
