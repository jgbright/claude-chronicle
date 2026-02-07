# Quick Visual Polish — Chat UI

## Context
The Chronicle chat interface works well functionally but looks like a developer MVP — harsh borders, no depth, abrupt hover states, and flat visual hierarchy. This pass softens the rough edges without changing layout, components, or architecture.

## Approach: CSS-only changes across 4 files

No component (.tsx) changes. No new dependencies. Just token and style updates.

### 1. Add shadow + transition tokens to `web/src/themes/tokens.css`

```css
/* New tokens */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2);
--shadow-md: 0 2px 8px rgba(0, 0, 0, 0.25);
--shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.3);
--transition-fast: 0.15s ease;
--transition-base: 0.2s ease;
--border-radius: 10px;       /* was 8px */
--border-radius-sm: 6px;     /* was 4px */
```

### 2. Update shared component styles in `web/src/index.css`

**Toolbar**: Replace hard border-bottom with subtle shadow
```css
.toolbar {
  border-bottom: none;             /* was 1px solid */
  box-shadow: var(--shadow-sm);
  z-index: 10;                     /* shadow sits above content */
}
```

**Sidebar**: Replace border-right with shadow, smooth item transitions
```css
.app__sidebar {
  border-right: none;              /* was 1px solid */
  box-shadow: var(--shadow-md);
  z-index: 5;
}
.session-list__item {
  transition: background var(--transition-base); /* was 0.1s */
}
```

**Messages**: Remove double-border (outer border + left accent), keep only left accent, soften
```css
.message {
  border: none;                    /* was 1px solid */
  border-left: 3px solid ...;     /* keep accent */
  /* no change to padding/layout */
}
```

**Code blocks**: Soften border
```css
.code-block {
  border-color: transparent;       /* let bg difference do the work */
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);  /* very subtle */
}
```

**Thinking + Tool use blocks**: Soften borders, add transitions
```css
.thinking {
  border-color: transparent;
  background: var(--thinking-bg);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
}
.thinking__header { transition: background var(--transition-fast); }

.tool-use {
  border-color: transparent;
  background: var(--tool-bg);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
}
.tool-use__header { transition: background var(--transition-fast); }
```

**All buttons/interactive elements**: Add base transition
```css
.edit-controls__btn,
.bulk-actions__btn,
.toolbar__export-btn,
.toolbar__theme-btn,
.toolbar__mode-btn {
  transition: all var(--transition-fast);
}
```

**Collapsed group**: Smooth transition
```css
.collapsed-group { transition: background var(--transition-base); }
```

### 3. Update Claude theme in `web/src/themes/claude/claude.css`

- Soften `--border-primary` and `--border-secondary` to be slightly more transparent
- Remove hard borders on `.claude-message`, keep left accent line
- Add transition to `.claude-thinking__header`, `.claude-collapsed`

```css
--border-primary: #353535;         /* was #3d3d3d — slightly softer */
--border-secondary: #2a2a2a;      /* was #2d2d2d — blend more */
```

```css
.claude-message { transition: border-color var(--transition-fast); }
.claude-thinking__header { transition: background var(--transition-fast); }
.claude-collapsed { transition: background var(--transition-base); }
```

### 4. Update Copilot theme in `web/src/themes/copilot/copilot.css`

- Remove outer border on `.copilot-message`, assistant messages get subtle bg only
- Soften border tokens
- Add transitions

```css
--border-primary: #282e36;         /* was #30363d — softer */
--border-secondary: #1e242b;       /* was #21262d — blend more */
```

```css
.copilot-message {
  border: none;                    /* was 1px solid */
}
.copilot-message--assistant {
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  /* bg difference alone distinguishes it */
}
.copilot-thinking__header { transition: background var(--transition-fast); }
.copilot-collapsed { transition: background var(--transition-base); }
```

## Files modified
1. `web/src/themes/tokens.css` — new shadow/transition tokens, bump border-radius
2. `web/src/index.css` — soften borders, add shadows, add transitions
3. `web/src/themes/claude/claude.css` — soften border tokens, add transitions
4. `web/src/themes/copilot/copilot.css` — remove message borders, soften tokens, add transitions

## What this does NOT change
- No component/TSX changes
- No new dependencies
- No layout changes
- No font changes (saving for a future pass)
- No icon changes (unicode arrows stay for now)

## Verification
1. `cd web && npm run dev` — open in browser, switch between Claude and Copilot themes
2. Check: messages no longer have harsh outer borders
3. Check: toolbar and sidebar have subtle shadow depth instead of hard lines
4. Check: hovering on thinking/tool-use/session-list items has smooth transitions
5. Check: code blocks look integrated rather than boxed-in
6. `cd web && npm test` — ensure no regressions (CSS-only, unlikely)
7. `cd web && npm run build && npm run build:export` — verify both builds succeed
