# Quick Start

## Install

Choose one method:

<details>
<summary>Release binary (Linux/macOS)</summary>

```bash
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)
[ "$ARCH" = "x86_64" ] && ARCH=amd64
[ "$ARCH" = "aarch64" ] && ARCH=arm64
curl -fL "https://github.com/jgbright/claude-chronicle/releases/latest/download/claude-chronicle_${OS}_${ARCH}.tar.gz" | tar xz
./claude-chronicle version
```

</details>

<details>
<summary>Release binary (Windows PowerShell)</summary>

```powershell
$arch = if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") { "arm64" } else { "amd64" }
curl.exe -fL "https://github.com/jgbright/claude-chronicle/releases/latest/download/claude-chronicle_windows_$arch.zip" | tar -x -f -
.\claude-chronicle.exe version
```

</details>

<details>
<summary>Go install (cross-platform)</summary>

```bash
go install github.com/jgbright/claude-chronicle/cmd/chronicle@latest
chronicle version
```

Requires Go 1.25+.

</details>

## Launch

```bash
./claude-chronicle serve
```

The server starts on `http://localhost:8080` and auto-opens your browser. It discovers Claude Code sessions from `~/.claude/projects/` and displays them in a browsable list.

## Browse Sessions

Select any session from the sidebar to view the full conversation. The viewer renders syntax-highlighted code, collapsible tool calls and thinking blocks, and file diffs.

In edit mode, you can delete noisy messages, collapse ranges into summaries, and add annotations explaining your decisions. All edits are non-destructive; the original session files are never modified.

## Export

Export a session as a single self-contained HTML file:

```bash
# By session ID
./claude-chronicle export -session <id> -o session.html

# By JSONL file path (bypasses discovery)
./claude-chronicle export -file path/to/session.jsonl -o out.html

# With a specific theme
./claude-chronicle export -session <id> -theme copilot -o session.html
```

You can also export from the web UI using the export button in the toolbar.

## CLI Reference

| Command | Description |
|---------|-------------|
| `serve` | Start the web viewer (default `:8080`, auto-opens browser) |
| `list` | List all discovered sessions |
| `export` | Export a session to standalone HTML |
| `dump-fixtures` | Generate JSON fixtures from real sessions (for smoke tests) |
| `version` | Print version info |

Run any command with `-h` for full options.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `CHRONICLE_DATA_DIR` | `~/.claude/projects/` | Override the session discovery path |

## Next Steps

- [Architecture](architecture.md) — architecture, data flow, pipelines
