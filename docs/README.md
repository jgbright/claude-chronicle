# Documentation

Onboarding guides for engineers working on Claude Chronicle.

| Guide | What it covers |
|-------|---------------|
| [**Getting Started**](GETTING-STARTED.md) | Prerequisites, build commands, two-terminal dev workflow, running tests, CLI reference |
| [**Architecture**](ARCHITECTURE.md) | System overview — Go backend packages, React frontend, API routes, key types |
| [**Data Flow**](DATA-FLOW.md) | End-to-end trace from JSONL files on disk to rendered pixels, covering both SPA and export paths |
| [**FAQ**](FAQ.md) | Top 5 questions new engineers ask, with code references and "why it matters" context |

## Where to start

- **Just want to build and run?** Start with [Getting Started](GETTING-STARTED.md).
- **Build failing with embed errors?** See the [FAQ](FAQ.md#2-why-does-go-build-fail-with-embed-errors).
- **Need to understand the codebase?** Read [Architecture](ARCHITECTURE.md) for the map, then [Data Flow](DATA-FLOW.md) for the details.
- **Want to understand the pipelines?** The [root README](../README.md#how-the-pipelines-work) covers the export pipeline, JSONL parsing, and CI/CD chain.
