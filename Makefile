.PHONY: build dev clean web-build web-install test test-go test-web test-web-watch lint smoke smoke-fixtures smoke-go smoke-web site-build

VERSION ?= dev
BRANCH ?= $(shell git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

# Build everything: web assets then Go binary
build: web-build
	go build -ldflags "-X main.version=$(VERSION) -X main.branch=$(BRANCH)" -o claude-chronicle.exe ./cmd/chronicle

# Install web dependencies
web-install:
	cd web && npm install

# Build web assets (SPA + export template)
web-build: web-install
	cd web && npm run build && npm run build:export

# Development: run Go server in dev mode (proxy to Vite)
dev:
	go run -ldflags "-X main.branch=$(BRANCH)" ./cmd/chronicle serve -dev

# Clean build artifacts
clean:
	rm -f claude-chronicle claude-chronicle.exe
	rm -rf web/dist web/dist-export

# Run all tests
test: test-go test-web

# Run Go tests (requires web build for embed)
test-go: web-build
	go test ./...

# Run frontend tests
test-web: web-install
	cd web && npm test

# Run frontend tests in watch mode
test-web-watch: web-install
	cd web && npx vitest

# Lint all code
lint:
	go vet ./...
	cd web && npm run lint

# Smoke tests: parse real sessions and render through frontend
smoke: smoke-fixtures smoke-go smoke-web

# Generate JSON fixtures from real session files
smoke-fixtures: build
	./claude-chronicle.exe dump-fixtures

# Go smoke test: parse real JSONL sessions
smoke-go:
	go test ./internal/session/ -run Smoke -count=1

# Frontend smoke test: render fixtures through SessionViewer
smoke-web:
	cd web && npx vitest run src/session/SessionViewer.smoke.test.tsx

# Build the Astro landing site
site-build:
	cd site && npm install && npm run build
