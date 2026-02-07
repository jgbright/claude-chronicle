# Codebase Improvement Backlog

Generated from brainstorm session on 2026-02-07. Tier 1 items were implemented; these are the remaining candidates.

## Tier 2: Solid Improvements

### Go Backend

**I. Replace hand-rolled integer parser in handleDeleteEdit**
- File: `internal/api/handlers_manifest.go:115-121`
- The index parser has no overflow protection. Use `strconv.Atoi` instead.
- Impact: low | Effort: low

**L. Atomic manifest writes**
- File: `internal/manifest/storage.go:45-61`
- `os.WriteFile` overwrites directly; a crash mid-write corrupts the file. Write to a temp file then `os.Rename` for atomicity.
- Impact: low | Effort: low

**M. Prefix matching for session IDs + show full IDs in list**
- Files: `internal/session/discovery.go`, `cmd/chronicle/main.go`
- `FindSession` requires exact ID match but `cmdList` truncates IDs to 8 chars, making them unusable for `cmdExport`. Add `strings.HasPrefix` matching (with ambiguity check) and show full IDs in list output.
- Impact: medium | Effort: medium

### React Frontend

**J. Stale session data on switch** (DONE — bundled into commit 8c38f64)

**K. Incomplete useManifest mock in App.test**
- File: `web/src/App.test.tsx:24-30`
- Mock is missing `undo`, `redo`, `canUndo`, `canRedo` fields added by the undo/redo feature. Works today because JS destructuring of undefined doesn't crash, but fragile.
- Impact: medium | Effort: low

**N. Collapsed group expand toggle does nothing**
- Files: `web/src/themes/claude/ClaudeCollapsedGroup.tsx`, `web/src/themes/copilot/CopilotCollapsedGroup.tsx`
- The component toggles an `expanded` state but can't show collapsed content because `applyManifest` filtered it out. Either remove the toggle or pass original messages through.
- Impact: medium | Effort: low (remove) or medium (implement real expand)

**O. Collapsed groups not keyboard accessible**
- Same files as N.
- Uses `<div onClick>` instead of `<button>` or `role="button"` with `tabIndex` and `onKeyDown`. Not reachable via keyboard.
- Impact: medium | Effort: medium

**P. No React error boundary**
- No error boundary exists. A rendering error in any message block crashes the entire app to a white screen.
- Impact: medium | Effort: medium

**Q. ExportViewer casts data without validation**
- File: `web/src/export/ExportViewer.tsx:23`
- `data as ExportData` with no shape check. Old or malformed exports produce cryptic errors.
- Impact: medium | Effort: medium

**R. useTheme doesn't validate localStorage value**
- File: `web/src/hooks/useTheme.ts:7`
- An invalid value in localStorage (e.g. `'dark'`) gets cast as a valid Theme and crashes `getThemeComponents()`.
- Impact: low | Effort: low

### Build / CI / DX

**S. Guard Pages deploy against fork PRs**
- File: `.github/workflows/ci.yml` deploy step
- `PAGES_DEPLOY_KEY` secret is unavailable for fork PRs, causing the step to fail. Add an `if:` condition.
- Impact: medium | Effort: low

**T. Add `test-web-watch` Makefile target**
- No watch mode target exists. Developers must know to run `cd web && npx vitest` manually.
- Impact: medium | Effort: low

**U. Add `web-install` prerequisite to `test-web` in Makefile**
- `make test-web` on a fresh clone without node_modules would fail.
- Impact: low | Effort: low

## Tier 3: Low Priority / Informational

- Unchecked `json.NewEncoder.Encode` errors in API handlers (6 sites)
- No CLI integration tests for `cmdList`/`cmdExport`
- Lossy `decodeProjectName` for paths containing hyphens (inherent Claude Code limitation)
- No request body size limit on manifest/export endpoints
- `openBrowser` silently swallows errors
- `handleSPA` creates a new `http.FileServerFS` on every request
- Theme component duplication between Claude and Copilot (~150 lines shared logic) — high effort
- Imperative `Prism.highlightElement` in CodeBlock — could lazy-highlight with IntersectionObserver
- Empty `export.css` placeholder file
- Unused `resetIdCounter` export in test factories
- No-op `Wrapper` components in both themes
- Unused `toolId` prop in `ToolUseBlock`
- Missing `formatTime` tests
- `vite.config.export.ts` not included in `tsconfig.node.json`
- Codecov token not configured (uploads may silently fail)
