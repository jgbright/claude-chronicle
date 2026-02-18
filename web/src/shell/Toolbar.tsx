import { useState, useRef, useEffect } from 'react';
import type { Theme } from '../themes/useTheme';
import type { SaveState } from '../manifest/useManifest';

interface Props {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  sessionTitle?: string;
  onExport?: () => void;
  hasSession: boolean;
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
  version?: string;
  branch?: string;
  // Undo/redo
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  // Collapse controls
  collapseThinking?: boolean;
  onToggleCollapseThinking?: () => void;
  collapseToolResults?: boolean;
  onToggleCollapseToolResults?: () => void;
  collapseFileReads?: boolean;
  onToggleCollapseFileReads?: () => void;
  showHidden?: boolean;
  onToggleShowHidden?: () => void;
  hasDeleteEdits?: boolean;
  // Save state
  saveState?: SaveState;
  onRetrySave?: () => void;
}

function buildDescriptor(version?: string, branch?: string): string | null {
  if (branch && branch !== 'main') return branch;
  if (!version) return null;
  return /^\d/.test(version) ? `v${version}` : version;
}

function CollapseDropdown({
  collapseThinking, onToggleCollapseThinking,
  collapseToolResults, onToggleCollapseToolResults,
  collapseFileReads, onToggleCollapseFileReads,
  showHidden, onToggleShowHidden, hasDeleteEdits,
}: {
  collapseThinking: boolean;
  onToggleCollapseThinking: () => void;
  collapseToolResults: boolean;
  onToggleCollapseToolResults: () => void;
  collapseFileReads: boolean;
  onToggleCollapseFileReads: () => void;
  showHidden: boolean;
  onToggleShowHidden: () => void;
  hasDeleteEdits: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const activeCount = [collapseThinking, collapseToolResults, collapseFileReads, showHidden].filter(Boolean).length;

  return (
    <div className="toolbar__dropdown" ref={ref}>
      <button
        className={`toolbar__dropdown-btn${activeCount > 0 ? ' toolbar__dropdown-btn--active' : ''}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        Collapse{activeCount > 0 && ` (${activeCount})`} &#9662;
      </button>
      {open && (
        <div className="toolbar__dropdown-menu">
          <label className="toolbar__dropdown-item">
            <input
              type="checkbox"
              checked={collapseThinking}
              onChange={onToggleCollapseThinking}
            />
            Hide thinking
          </label>
          <label className="toolbar__dropdown-item">
            <input
              type="checkbox"
              checked={collapseToolResults}
              onChange={onToggleCollapseToolResults}
            />
            Hide tool results
          </label>
          <label className="toolbar__dropdown-item">
            <input
              type="checkbox"
              checked={collapseFileReads}
              onChange={onToggleCollapseFileReads}
            />
            Hide file reads
          </label>
          <label className={`toolbar__dropdown-item${!hasDeleteEdits ? ' toolbar__dropdown-item--disabled' : ''}`}>
            <input
              type="checkbox"
              checked={showHidden}
              onChange={onToggleShowHidden}
              disabled={!hasDeleteEdits}
            />
            Show hidden blocks
          </label>
        </div>
      )}
    </div>
  );
}

function SaveIndicator({ saveState, onRetry }: { saveState: SaveState; onRetry?: () => void }) {
  if (saveState === 'idle') return null;
  return (
    <span className={`toolbar__save toolbar__save--${saveState}`}>
      {saveState === 'saving' && 'Saving...'}
      {saveState === 'saved' && 'Saved \u2713'}
      {saveState === 'error' && (
        <>
          Save failed
          {onRetry && (
            <>
              {' \u2014 '}
              <button className="toolbar__save-retry" onClick={onRetry}>Retry</button>
            </>
          )}
        </>
      )}
    </span>
  );
}

export function Toolbar({
  theme, onThemeChange, sessionTitle, onExport, hasSession,
  isCollapsed, onToggleCollapsed, version, branch,
  onUndo, onRedo, canUndo = false, canRedo = false,
  collapseThinking = false, onToggleCollapseThinking,
  collapseToolResults = false, onToggleCollapseToolResults,
  collapseFileReads = false, onToggleCollapseFileReads,
  showHidden = false, onToggleShowHidden,
  hasDeleteEdits = false,
  saveState = 'idle', onRetrySave,
}: Props) {
  const descriptor = buildDescriptor(version, branch);
  return (
    <div className="toolbar">
      <div className="toolbar__left">
        <h1 className="toolbar__brand">
          Chronicle{descriptor && <span className="toolbar__descriptor">{descriptor}</span>}
        </h1>
        {sessionTitle && <span className="toolbar__title">{sessionTitle}</span>}
      </div>
      <div className="toolbar__right">
        {hasSession && (
          <>
            {onToggleCollapsed && (
              <button
                className={`toolbar__focus-btn${isCollapsed ? ' toolbar__focus-btn--active' : ''}`}
                onClick={onToggleCollapsed}
              >
                {isCollapsed ? 'Unfocus' : 'Focus'}
              </button>
            )}
            {onToggleCollapseThinking && onToggleCollapseToolResults && onToggleCollapseFileReads && onToggleShowHidden && (
              <CollapseDropdown
                collapseThinking={collapseThinking}
                onToggleCollapseThinking={onToggleCollapseThinking}
                collapseToolResults={collapseToolResults}
                onToggleCollapseToolResults={onToggleCollapseToolResults}
                collapseFileReads={collapseFileReads}
                onToggleCollapseFileReads={onToggleCollapseFileReads}
                showHidden={showHidden}
                onToggleShowHidden={onToggleShowHidden}
                hasDeleteEdits={hasDeleteEdits}
              />
            )}
            <SaveIndicator saveState={saveState} onRetry={onRetrySave} />
            {onUndo && (
              <button
                className="toolbar__action-btn"
                onClick={onUndo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
              >
                Undo
              </button>
            )}
            {onRedo && (
              <button
                className="toolbar__action-btn"
                onClick={onRedo}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
              >
                Redo
              </button>
            )}
            {onExport && (
              <button className="toolbar__export-btn" onClick={onExport}>
                Export
              </button>
            )}
          </>
        )}
        <div className="toolbar__theme-switch">
          <button
            className={`toolbar__theme-btn ${theme === 'claude' ? 'toolbar__theme-btn--active' : ''}`}
            onClick={() => onThemeChange('claude')}
          >
            Claude
          </button>
          <button
            className={`toolbar__theme-btn ${theme === 'copilot' ? 'toolbar__theme-btn--active' : ''}`}
            onClick={() => onThemeChange('copilot')}
          >
            Copilot
          </button>
        </div>
      </div>
    </div>
  );
}
