import type { Theme } from '../themes/useTheme';

interface Props {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  sessionTitle?: string;
  editMode: boolean;
  onEditModeChange: (editMode: boolean) => void;
  onExport?: () => void;
  hasSession: boolean;
}

export function Toolbar({
  theme,
  onThemeChange,
  sessionTitle,
  editMode,
  onEditModeChange,
  onExport,
  hasSession,
}: Props) {
  return (
    <div className="toolbar">
      <div className="toolbar__left">
        <h1 className="toolbar__brand">Chronicle</h1>
        {sessionTitle && <span className="toolbar__title">{sessionTitle}</span>}
      </div>
      <div className="toolbar__right">
        {hasSession && (
          <>
            <div className="toolbar__mode-switch">
              <button
                className={`toolbar__mode-btn ${!editMode ? 'toolbar__mode-btn--active' : ''}`}
                onClick={() => onEditModeChange(false)}
              >
                View
              </button>
              <button
                className={`toolbar__mode-btn ${editMode ? 'toolbar__mode-btn--active' : ''}`}
                onClick={() => onEditModeChange(true)}
              >
                Edit
              </button>
            </div>
            {onExport && (
              <button className="toolbar__export-btn" onClick={onExport}>
                Export HTML
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
