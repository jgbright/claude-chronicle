# Frontend Domain Reorganization

**Status**: proposed (updated 2026-02-07 — reflects theme component architecture from commit `908f3f2`)

## Summary

Reorganize `web/src/` from role-based folders (`components/`, `hooks/`, `lib/`, `types/`, `api/`) to domain-scoped folders (`session/`, `manifest/`, `export/`, `shared/`, `shell/`) that mirror the Go backend's organization. The `themes/` directory stays in place — it already has good internal structure with per-theme component trees.

The Go backend is already well-organized using domain-driven folders (`internal/session/`, `internal/manifest/`, `internal/export/`, `internal/api/`) and requires no structural changes. The frontend's flat, role-based layout makes it difficult to understand which files relate to which feature and forces developers to navigate across multiple directories when working on a single concern.

The reorganization is designed for **zero impact on tooling**: no changes to `embed.go`, `Makefile`, CI workflows, GoReleaser, or Vite configs, since only `web/src/` internals change.

## Proposal scoring

Three competing proposals were analyzed by independent agents and scored by a judge.

### Summary table

| Criterion | A: Domain-Driven | B: Clean Architecture | C: Monorepo |
|---|:---:|:---:|:---:|
| Discoverability | 7 | 5 | 4 |
| Scalability | 8 | 7 | 6 |
| Separation of concerns | 8 | 7 | 5 |
| Consistency | 8 | 6 | 5 |
| Minimal churn | 5 | 2 | 1 |
| Go idiom compliance | 10 | 3 | 4 |
| Frontend org quality | 8 | 5 | 3 |
| **Total** | **54/70** | **35/70** | **28/70** |

### Proposal A: Domain-Driven (Frontend Only) — Winner

- Domain folders make it clear where manifest vs session code lives
- Each domain is self-contained with types, API, hooks, components, CSS, tests
- Uniform pattern across all domains; mirrors Go backend structure
- Every frontend file moves but no Go, Makefile, CI, or embed.go changes needed
- CSS decomposition addresses the 904-line monolith
- Splitting the 61-line `client.ts` into 3 domain-scoped API modules is debatable at current scale but establishes a good pattern

### Proposal B: Clean Architecture / Ports-and-Adapters

- Jargon-heavy naming (`adapter/filesession`, `adapter/httpapi`)
- Introduces port interfaces without current need for swappable backends
- Removes `internal/`, violating Go convention and losing compile-time import restrictions
- Frontend changes are minimal — does not address the CSS monolith or component co-location

### Proposal C: Monorepo/Workspace

- Two levels of indirection before reaching code
- Fights the embed.go integration with a copy-at-build-time hack
- Every single file moves; Makefile, CI, GoReleaser, go.mod all need rework
- Frontend internals explicitly unchanged — no organizational improvement

## Winner rationale

Proposal A wins by a significant margin (54 vs 35 vs 28) because it correctly identifies that the Go backend is already well-organized and focuses effort where the actual pain point is: the flat, role-grouped React frontend.

The key insight is that the Go backend already follows domain-driven organization, and the frontend should mirror it. This creates structural symmetry without touching any sensitive tooling integrations.

Proposal B introduces unnecessary abstraction for a single-developer project with no third-party Go dependencies and no foreseeable need for swappable backends. Proposal C fundamentally fights the project's architecture — this is a single-binary tool where the frontend is embedded into the Go binary; physically separating them and building a bridge to reconnect adds complexity without benefit.

## Recommended directory tree

```
web/src/
  main.tsx                 # updated imports only
  export-main.tsx          # updated imports only

  session/                 # DOMAIN: session browsing and viewing
    types.ts               # from types/session.ts
    api.ts                 # fetchSessions, fetchSession (from api/client.ts)
    useSessionList.ts      # from hooks/useSession.ts (split)
    useSessionData.ts      # from hooks/useSession.ts (split)
    SessionList.tsx
    SessionList.test.tsx
    SessionViewer.tsx
    SessionViewer.test.tsx
    EditControls.tsx        # from components/EditControls.tsx (only consumed by SessionViewer)
    EditControls.test.tsx
    session.css

  manifest/                # DOMAIN: edit manifest system
    types.ts               # from types/manifest.ts
    api.ts                 # fetchManifest, saveManifest, addEdit, removeEdit
    useManifest.ts
    useManifest.test.ts
    sessionTransform.ts    # from lib/sessionTransform.ts
    sessionTransform.test.ts
    manifest.css

  export/                  # DOMAIN: HTML export
    api.ts                 # exportSession (from api/client.ts)
    ExportViewer.tsx
    ExportViewer.test.tsx
    export.css

  themes/                  # STAYS IN PLACE — already well-structured
    ThemeComponents.ts     # ThemeComponentSet interface
    ThemeContext.ts         # Context provider + useThemeComponents()
    registry.ts            # getThemeComponents() lookup
    useTheme.ts            # MOVED HERE from hooks/useTheme.ts
    useTheme.test.ts       # MOVED HERE from hooks/useTheme.test.ts
    tokens.css
    prism-chronicle.css
    claude/                # Per-theme component tree (already exists)
      components.ts
      ClaudeMessageBlock.tsx
      ClaudeAnnotationBlock.tsx
      ClaudeCollapsedGroup.tsx
      claude.css
    copilot/               # Per-theme component tree (already exists)
      components.ts
      CopilotMessageBlock.tsx
      CopilotAnnotationBlock.tsx
      CopilotCollapsedGroup.tsx
      copilot.css

  shared/                  # Cross-domain rendering primitives (3 components + 2 utils)
    CodeBlock.tsx
    CodeBlock.test.tsx
    MarkdownContent.tsx
    MarkdownContent.test.tsx
    ToolUseBlock.tsx
    ToolUseBlock.test.tsx
    formatUtils.ts
    toolUtils.ts
    shared.css

  shell/                   # App orchestration
    App.tsx
    Toolbar.tsx
    Toolbar.test.tsx
    shell.css

  test/                    # Shared test infrastructure (unchanged)
    factories.ts
    setup.ts

  index.css                # Reduced to @import aggregator
```

### Dead code to delete

The theme component architecture (commit `908f3f2`) introduced per-theme component trees dispatched via React Context. These 5 generic components in `components/` are now dead code with zero production imports:

| Component | Replaced by |
|---|---|
| `components/MessageBlock.tsx` + test | `ClaudeMessageBlock`, `CopilotMessageBlock` |
| `components/AnnotationBlock.tsx` + test | `ClaudeAnnotationBlock`, `CopilotAnnotationBlock` |
| `components/CollapsedGroup.tsx` + test | `ClaudeCollapsedGroup`, `CopilotCollapsedGroup` |
| `components/ThinkingBlock.tsx` + test | Inlined into per-theme MessageBlocks |
| `components/FileChangeBlock.tsx` + test | Inlined into per-theme MessageBlocks |

Total: 10 files deleted.

### Design decisions

- **`themes/` stays as `themes/`** (not renamed to `theme/`): It already has good internal structure with `ThemeComponents.ts`, `ThemeContext.ts`, `registry.ts`, and per-theme subdirectories. Renaming would be 15+ files of churn for zero benefit.
- **`EditControls` in `session/`**: It's only consumed by `SessionViewer`, not theme-specific. It was originally planned for `manifest/` but belongs with its sole consumer.
- **Only 3 shared components**: `CodeBlock`, `MarkdownContent`, and `ToolUseBlock` are the rendering primitives imported by both Claude and Copilot theme components. The other 5 components are dead code (see above).
- **Split useSession.ts**: The two hooks (`useSessionList`, `useSessionData`) are independent and share no state; separate files make each single-purpose.
- **index.css as import aggregator**: Preserves the single-import pattern in entry points while distributing styles to domains.
- **Optional Go-side cleanup**: Extract `formatSize`, `formatAge`, `openBrowser` from `main.go` into `internal/cli/helpers.go`. Nice-to-have, not required.

## Migration mapping

### Files to move

| Old Path | New Path |
|---|---|
| `types/session.ts` | `session/types.ts` |
| `types/manifest.ts` | `manifest/types.ts` |
| `lib/formatUtils.ts` | `shared/formatUtils.ts` |
| `lib/toolUtils.ts` | `shared/toolUtils.ts` |
| `lib/sessionTransform.ts` | `manifest/sessionTransform.ts` |
| `lib/sessionTransform.test.ts` | `manifest/sessionTransform.test.ts` |
| `components/CodeBlock.tsx` | `shared/CodeBlock.tsx` |
| `components/CodeBlock.test.tsx` | `shared/CodeBlock.test.tsx` |
| `components/MarkdownContent.tsx` | `shared/MarkdownContent.tsx` |
| `components/MarkdownContent.test.tsx` | `shared/MarkdownContent.test.tsx` |
| `components/ToolUseBlock.tsx` | `shared/ToolUseBlock.tsx` |
| `components/ToolUseBlock.test.tsx` | `shared/ToolUseBlock.test.tsx` |
| `components/SessionList.tsx` | `session/SessionList.tsx` |
| `components/SessionList.test.tsx` | `session/SessionList.test.tsx` |
| `components/SessionViewer.tsx` | `session/SessionViewer.tsx` |
| `components/SessionViewer.test.tsx` | `session/SessionViewer.test.tsx` |
| `components/EditControls.tsx` | `session/EditControls.tsx` |
| `components/EditControls.test.tsx` | `session/EditControls.test.tsx` |
| `components/ExportViewer.tsx` | `export/ExportViewer.tsx` |
| `components/ExportViewer.test.tsx` | `export/ExportViewer.test.tsx` |
| `components/Toolbar.tsx` | `shell/Toolbar.tsx` |
| `components/Toolbar.test.tsx` | `shell/Toolbar.test.tsx` |
| `api/client.ts` | Split into `session/api.ts`, `manifest/api.ts`, `export/api.ts` |
| `api/client.test.ts` | Split/moved into domain API tests |
| `hooks/useSession.ts` | Split into `session/useSessionList.ts`, `session/useSessionData.ts` |
| `hooks/useManifest.ts` | `manifest/useManifest.ts` |
| `hooks/useManifest.test.ts` | `manifest/useManifest.test.ts` |
| `hooks/useTheme.ts` | `themes/useTheme.ts` |
| `hooks/useTheme.test.ts` | `themes/useTheme.test.ts` |
| `App.tsx` | `shell/App.tsx` |
| `index.css` | Reduced to `@import` aggregator; styles distributed to domain CSS |

### Files to delete (dead code)

| File | Reason |
|---|---|
| `components/MessageBlock.tsx` | Replaced by per-theme MessageBlocks |
| `components/MessageBlock.test.tsx` | Test for dead component |
| `components/AnnotationBlock.tsx` | Replaced by per-theme AnnotationBlocks |
| `components/AnnotationBlock.test.tsx` | Test for dead component |
| `components/CollapsedGroup.tsx` | Replaced by per-theme CollapsedGroups |
| `components/CollapsedGroup.test.tsx` | Test for dead component |
| `components/ThinkingBlock.tsx` | Inlined into per-theme MessageBlocks |
| `components/ThinkingBlock.test.tsx` | Test for dead component |
| `components/FileChangeBlock.tsx` | Inlined into per-theme MessageBlocks |
| `components/FileChangeBlock.test.tsx` | Test for dead component |

### Files that stay in place

`themes/` and its contents remain unchanged — the directory already has good internal structure. No CSS files need to move. Only `useTheme.ts` moves *into* `themes/` from `hooks/`.

All paths are relative to `web/src/`.

### Theme component import updates

After reorg, theme components need updated imports for shared primitives:
- `../../components/CodeBlock` → `../../shared/CodeBlock`
- `../../components/MarkdownContent` → `../../shared/MarkdownContent`
- `../../components/ToolUseBlock` → `../../shared/ToolUseBlock`
- `../../lib/formatUtils` → `../../shared/formatUtils`
- `../../lib/toolUtils` → `../../shared/toolUtils`

And internal theme imports:
- `themes/ThemeComponents.ts`: `../types/session` → `../session/types`, `../lib/sessionTransform` → `../manifest/sessionTransform`
- `themes/registry.ts`: `../hooks/useTheme` → `./useTheme`

## Migration plan

### Phase 0: Preparation

1. Ensure all tests pass (`cd web && npm test` and Go tests).
2. Create a branch for the migration.

### Phase 1: Create directory scaffolding

3. Create directories: `session/`, `manifest/`, `export/`, `shared/`, `shell/`. (`themes/` already exists.)

### Phase 2: Move types (foundation layer)

4. Move `types/session.ts` → `session/types.ts`.
5. Move `types/manifest.ts` → `manifest/types.ts`.
6. Update all imports of `../types/session` and `../types/manifest`. This is the widest-reaching change — nearly every file imports types.
7. Run tests.

### Phase 3: Move shared utilities, rendering components, and delete dead code

8. Move `lib/formatUtils.ts` and `lib/toolUtils.ts` → `shared/`.
9. Move `lib/sessionTransform.ts` (and test) → `manifest/`.
10. Move surviving shared components → `shared/`: CodeBlock, MarkdownContent, ToolUseBlock (each with tests).
11. Delete 5 dead components (10 files): MessageBlock, AnnotationBlock, CollapsedGroup, ThinkingBlock, FileChangeBlock (each with tests). These are replaced by per-theme implementations.
12. Update all imports. Run tests.

### Phase 4: Move domain-specific components

13. Move SessionList, SessionViewer (with tests) → `session/`.
14. Move EditControls (with test) → `session/` (only consumed by SessionViewer).
15. Move ExportViewer (with test) → `export/`.
16. Move Toolbar (with test) → `shell/`.
17. Update all imports. Run tests.

### Phase 5: Split API client

18. Create `session/api.ts` with `fetchSessions` and `fetchSession`.
19. Create `manifest/api.ts` with `fetchManifest`, `saveManifest`, `addEdit`, `removeEdit`.
20. Create `export/api.ts` with `exportSession`.
21. Update consumers. Delete `api/client.ts` and `api/client.test.ts`.
22. Run tests.

### Phase 6: Move hooks

23. Split `hooks/useSession.ts` → `session/useSessionList.ts` and `session/useSessionData.ts`.
24. Move `hooks/useManifest.ts` (with test) → `manifest/`.
25. Move `hooks/useTheme.ts` (with test) → `themes/useTheme.ts`. Update `themes/registry.ts` import from `../hooks/useTheme` to `./useTheme`.
26. Update imports. Run tests.

### Phase 7: Move App.tsx and entry points

27. Move `App.tsx` → `shell/App.tsx`.
28. Update `main.tsx` to import from `./shell/App`.
29. Update `export-main.tsx` to import from `./export/ExportViewer`.
30. Run tests.

### Phase 8: Decompose CSS

31. Extract CSS blocks from `index.css` into domain-scoped files:
    - `shared/shared.css`: reset, scrollbar, layout, message, markdown, code-block, tool-use, tool-result
    - `session/session.css`: session-list, session-viewer, edit-controls
    - `manifest/manifest.css`: bulk-actions
    - `shell/shell.css`: toolbar
    - `export/export.css`: minimal/empty
32. Replace `index.css` with `@import` directives.
33. Run dev server and visually verify. Run tests.

### Phase 9: Update theme component imports

34. Update imports in `themes/claude/` and `themes/copilot/` components to point to new `shared/` and `manifest/` locations (see "Theme component import updates" in migration mapping).
35. Update `themes/ThemeComponents.ts` imports: `../types/session` → `../session/types`, `../lib/sessionTransform` → `../manifest/sessionTransform`.
36. Run tests.

### Phase 10: Cleanup

37. Delete empty directories: `types/`, `hooks/`, `lib/`, `api/`, `components/`.
38. Optional: extract `formatSize`, `formatAge`, `openBrowser` from `main.go` into `internal/cli/helpers.go`.
39. Final full test run.
40. Update `test/factories.ts` imports if needed.

### Phase 11: Documentation

40. Add comments to each domain's `types.ts` noting its Go counterpart.
41. Update CLAUDE.md to reflect the new frontend structure.

Each phase ends with a test run to catch breakage immediately.

## Ideas merged from other proposals

### From Proposal B (Clean Architecture)

- **Port interfaces for testability (selectively)**: The Go handlers currently call `session.DiscoverSessions()` and `session.FindSession()` as package-level functions, making them hard to mock. Adding a `SessionStore` interface to `internal/api/server.go` would improve testability without restructuring the backend. This is a surgical improvement, not a reorganization.
- **Thin `cmd/` composition root**: `main.go` at 247 lines contains utility functions that belong elsewhere. These could move to `internal/cli/`. Minor cleanup, not structural.

### From Proposal C (Monorepo/Workspace)

- **Explicit API contract documentation**: The frontend's type files should include comments noting their Go counterparts. A simpler approach than Proposal C's separate `contracts/` directory: just document the correspondence inline. No code duplication.
