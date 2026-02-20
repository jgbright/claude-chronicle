# Claude Chronicle

[![CI](https://github.com/jgbright/claude-chronicle/actions/workflows/ci.yml/badge.svg)](https://github.com/jgbright/claude-chronicle/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/jgbright/claude-chronicle/graph/badge.svg)](https://codecov.io/gh/jgbright/claude-chronicle)
[![GitHub release](https://img.shields.io/github/v/release/jgbright/claude-chronicle)](https://github.com/jgbright/claude-chronicle/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Turn your [Claude Code](https://claude.ai/code) sessions into shareable walkthroughs.

Working with Claude Code is a collaborative process: you prompt, steer, correct course, and build something together. But when the session is over, all that context lives in a raw log that's hard for anyone else to follow. Chronicle lets you turn those sessions into something you can share: a narrated, curated record of what happened and why.

Think of it like a Loom recording for your AI sessions. You pick a session, trim the noise, collapse the parts that don't matter, add annotations explaining your thinking (why you prompted a certain way, what you were steering toward, what you'd do differently), and export a single HTML file you can send to anyone.

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

Install and launch in under a minute.

1. **Download** the [latest release](https://github.com/jgbright/claude-chronicle/releases/latest) for your platform, or install with Go:

   ```bash
   go install github.com/jgbright/claude-chronicle/cmd/chronicle@latest
   ```

2. **Run:**

   ```bash
   ./claude-chronicle serve
   ```

   The app auto-opens in your browser showing your Claude Code sessions.

See [Quick Start Guide](docs/quickstart.md) for platform-specific install options, CLI reference, and configuration.

## Documentation

| Guide | What it covers |
|-------|---------------|
| [**Quick Start**](docs/quickstart.md) | Install, launch, browse sessions, export, CLI reference |
| [**Architecture**](docs/architecture.md) | Architecture, data flow, pipelines, CI/CD, design decisions |

## License

MIT — see [LICENSE](LICENSE).
