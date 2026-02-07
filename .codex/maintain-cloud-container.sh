#!/bin/bash
# .codex/maintain-cloud-container.sh — Refresh a cached Codex container after branch checkout
#
# When a container is resumed from cache, Go is already installed but the
# web assets may be stale and package.json may have changed. This script
# re-installs Node dependencies and rebuilds the frontend so `go build`
# stays working.
#
# Codex configuration:
#   Environment settings > Maintenance script > Manual > bash .codex/maintain-cloud-container.sh
#
# See .codex/setup-cloud-container.sh for the full first-run bootstrap.

set -euo pipefail

# Re-install web dependencies (picks up any package.json changes)
cd /workspace/claude-chronicle/web && npm install

# Rebuild web assets (needed for Go embed)
npm run build && npm run build:export

# Regenerate AGENTS.md from CLAUDE.md (single source of truth for AI instructions)
cp /workspace/claude-chronicle/.claude/CLAUDE.md /workspace/claude-chronicle/AGENTS.md

# Verify
printf "***\n*** ENVIRONMENT DETAILS 👇👇👇 \n***\nEnv: %s %s | %s | Go: %s | Node: %s | Pwd: %s\n***\n*** ENVIRONMENT DETAILS 👆👆👆 \n***\n" \
  "$(uname -s)" "$(uname -m)" \
  "$(. /etc/os-release 2>/dev/null && echo "$PRETTY_NAME" || uname -r)" \
  "$(go version | awk '{print $3}')" "$(node --version)" "$(pwd)"
