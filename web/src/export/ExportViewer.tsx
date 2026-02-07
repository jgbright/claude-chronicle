import { useState, useEffect } from 'react';
import type { ParsedSession } from '../session/types';
import type { EditManifest, Edit } from '../manifest/types';
import type { Theme } from '../themes/useTheme';
import { SessionViewer } from '../session/SessionViewer';
import { Toolbar } from '../shell/Toolbar';
import { ThemeComponentProvider } from '../themes/ThemeContext';
import { getThemeComponents } from '../themes/registry';

interface ExportData {
  session: ParsedSession;
  manifest: EditManifest | null;
  theme: string;
}

interface Props {
  data: unknown;
}

export function ExportViewer({ data }: Props) {
  if (!data) {
    return <div className="app__error">No session data found</div>;
  }

  return <ExportViewerInner data={data as ExportData} />;
}

function ExportViewerInner({ data }: { data: ExportData }) {
  const [theme, setTheme] = useState<Theme>(
    data.theme === 'copilot' ? 'copilot' : 'claude',
  );
  const [editMode, setEditMode] = useState(false);
  const [manifest, setManifest] = useState<EditManifest | null>(data.manifest);
  const [redoStack, setRedoStack] = useState<Edit[]>([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const themeComponents = getThemeComponents(theme);
  const { Wrapper: ThemeWrapper } = themeComponents;

  const handleAddEdit = (edit: Edit) => {
    setRedoStack([]);
    setManifest((prev) => {
      const base = prev || { version: 1, sessionId: data.session.info.id, edits: [] };
      return { ...base, edits: [...base.edits, edit] };
    });
  };

  const handleRemoveEdit = (index: number) => {
    setManifest((prev) => {
      if (!prev) return prev;
      return { ...prev, edits: prev.edits.filter((_, i) => i !== index) };
    });
  };

  const handleUndo = () => {
    if (!manifest || manifest.edits.length === 0) return;
    const lastEdit = manifest.edits[manifest.edits.length - 1];
    setRedoStack((prev) => [...prev, lastEdit]);
    setManifest((prev) => {
      if (!prev) return prev;
      return { ...prev, edits: prev.edits.slice(0, -1) };
    });
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const edit = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setManifest((prev) => {
      const base = prev || { version: 1, sessionId: data.session.info.id, edits: [] };
      return { ...base, edits: [...base.edits, edit] };
    });
  };

  const canUndo = !!manifest && manifest.edits.length > 0;
  const canRedo = redoStack.length > 0;

  return (
    <ThemeComponentProvider value={themeComponents}>
      <ThemeWrapper>
        <div className="app">
          <Toolbar
            theme={theme}
            onThemeChange={setTheme}
            sessionTitle={data.session.info.projectName}
            editMode={editMode}
            onEditModeChange={setEditMode}
            hasSession={true}
          />
          <div className="app__main">
            <div className="app__content">
              <SessionViewer
                session={data.session}
                manifest={manifest}
                editMode={editMode}
                onAddEdit={handleAddEdit}
                onRemoveEdit={handleRemoveEdit}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={canUndo}
                canRedo={canRedo}
              />
            </div>
          </div>
        </div>
      </ThemeWrapper>
    </ThemeComponentProvider>
  );
}
