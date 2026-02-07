#!/bin/bash
# .codex/setup-cloud-container.sh — Environment bootstrap for OpenAI Codex cloud
#
# Installs Go, Node dependencies, and pre-builds web assets so that
# `go build` can succeed (the Go binary embeds the compiled frontend).
#
# For local development, use the devcontainer (.devcontainer/devcontainer.json)
# instead — it provides the same toolchain without manual setup.
#
# Codex configuration:
#   Environment settings > Setup script > Manual > bash .codex/setup-cloud-container.sh
#   Enable "Container caching" so dependencies are preserved between runs.

set -euo pipefail

# Install Go 1.25.7 (universal image may have an older version)
GO_VERSION=1.25.7
wget -q "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz"
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf "go${GO_VERSION}.linux-amd64.tar.gz"
rm "go${GO_VERSION}.linux-amd64.tar.gz"
export PATH=/usr/local/go/bin:$PATH

# Install Node.js 24 (align with devcontainer which uses node:24)
NODE_MAJOR=24
curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
sudo apt-get install -y nodejs

# Install web dependencies
cd /workspace/claude-chronicle/web && npm install

# Build web assets (needed for Go embed)
npm run build && npm run build:export

# Generate AGENTS.md from CLAUDE.md (single source of truth for AI instructions)
cp /workspace/claude-chronicle/.claude/CLAUDE.md /workspace/claude-chronicle/AGENTS.md

# Verify
printf "***\n*** ENVIRONMENT DETAILS 👇👇👇 \n***\nEnv: %s %s | %s | Go: %s | Node: %s | Pwd: %s\n***\n*** ENVIRONMENT DETAILS 👆👆👆 \n***\n" \
  "$(uname -s)" "$(uname -m)" \
  "$(. /etc/os-release 2>/dev/null && echo "$PRETTY_NAME" || uname -r)" \
  "$(go version | awk '{print $3}')" "$(node --version)" "$(pwd)"
