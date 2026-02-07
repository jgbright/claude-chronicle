import { useState } from 'react';
import { useSessionList } from '../session/useSessionList';
import { useSessionData } from '../session/useSessionData';
import { useManifest } from '../manifest/useManifest';
import { useTheme } from '../themes/useTheme';
import { exportSession } from '../export/api';
import { Toolbar } from './Toolbar';
import { SessionList } from '../session/SessionList';
import { SessionViewer } from '../session/SessionViewer';
import { ThemeComponentProvider } from '../themes/ThemeContext';
import { getThemeComponents } from '../themes/registry';

export default function App() {
  const { theme, setTheme } = useTheme();
  const { sessions, loading: listLoading, error: listError } = useSessionList();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { session, loading: sessionLoading, error: sessionError } = useSessionData(selectedId);
  const { manifest, addEdit, removeEdit, undo, redo, canUndo, canRedo } = useManifest(selectedId);
  const [editMode, setEditMode] = useState(false);
  const themeComponents = getThemeComponents(theme);
  const { Wrapper: ThemeWrapper } = themeComponents;

  const handleExport = async () => {
    if (!selectedId) return;
    try {
      const blob = await exportSession(selectedId, theme);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chronicle-${selectedId.slice(0, 8)}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Export not yet available');
    }
  };

  return (
    <ThemeComponentProvider value={themeComponents}>
      <ThemeWrapper>
        <div className="app">
          <Toolbar
            theme={theme}
            onThemeChange={setTheme}
            sessionTitle={session?.info.projectName}
            editMode={editMode}
            onEditModeChange={setEditMode}
            onExport={handleExport}
            hasSession={!!session}
          />
          <div className="app__main">
            <div className="app__sidebar">
              {listLoading ? (
                <div className="app__loading">Loading sessions...</div>
              ) : listError ? (
                <div className="app__error">{listError}</div>
              ) : (
                <SessionList
                  sessions={sessions}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              )}
            </div>
            <div className="app__content">
              {!selectedId ? (
                <div className="app__empty">Select a session to view</div>
              ) : sessionLoading ? (
                <div className="app__loading">Loading session...</div>
              ) : sessionError ? (
                <div className="app__error">{sessionError}</div>
              ) : session ? (
                <SessionViewer
                  session={session}
                  manifest={manifest}
                  editMode={editMode}
                  onAddEdit={addEdit}
                  onRemoveEdit={removeEdit}
                  onUndo={undo}
                  onRedo={redo}
                  canUndo={canUndo}
                  canRedo={canRedo}
                />
              ) : null}
            </div>
          </div>
        </div>
      </ThemeWrapper>
    </ThemeComponentProvider>
  );
}
