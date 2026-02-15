import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSessionList } from '../session/useSessionList';
import { useProjects } from '../session/useProjects';
import { useSessionData } from '../session/useSessionData';
import { useSSE } from '../session/useSSE';
import { useManifest } from '../manifest/useManifest';
import { deleteSession, restoreSession, updateMetadata } from '../manifest/api';
import { useTheme } from '../themes/useTheme';
import { exportSession } from '../export/api';
import { useDeferredLoading } from '../hooks/useDeferredLoading';
import { useToast } from '../shared/useToast';
import { ToastContainer } from '../shared/Toast';
import { Toolbar } from './Toolbar';
import { SessionFilters } from '../session/SessionFilters';
import { SessionList } from '../session/SessionList';
import { SessionViewer } from '../session/SessionViewer';
import { ThemeComponentProvider } from '../themes/ThemeContext';
import { getThemeComponents } from '../themes/registry';
import { useResizableSidebar } from './useResizableSidebar';
import { useBuildInfo } from './useBuildInfo';

export default function App() {
  const buildInfo = useBuildInfo();
  const { theme, setTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [showDeletedSessions, setShowDeletedSessions] = useState(false);
  const { projects, refresh: refreshProjects } = useProjects();
  const { sessions, loading: listLoading, error: listError, refresh: refreshSessions, isSearching } = useSessionList(searchTerm, projectFilter, showDeletedSessions);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { session, initialManifest, loading: sessionLoading, error: sessionError, refresh: refreshSession, patchTitle } = useSessionData(selectedId);
  const { manifest, addEdit, removeEdit, undo, redo, canUndo, canRedo, updateTitle, saveState } = useManifest(selectedId, initialManifest);
  const themeComponents = getThemeComponents(theme);
  const { Wrapper: ThemeWrapper } = themeComponents;
  const { sidebarWidth, isDragging, isCollapsed, toggleCollapsed, hasMovedRef, dividerProps } = useResizableSidebar();
  const { toasts, show: showToast, dismiss: dismissToast } = useToast();

  // View-state toggles (reset on session change)
  const [collapseThinking, setCollapseThinking] = useState(false);
  const [collapseToolResults, setCollapseToolResults] = useState(false);
  const [showHiddenBlocks, setShowHiddenBlocks] = useState(false);
  const [prevSessionId, setPrevSessionId] = useState<string | null>(null);
  if (selectedId !== prevSessionId) {
    setPrevSessionId(selectedId);
    setCollapseThinking(false);
    setCollapseToolResults(false);
    setShowHiddenBlocks(false);
  }

  const hasDeleteEdits = useMemo(
    () => !!manifest && manifest.edits.some((e) => e.type === 'delete'),
    [manifest]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCollapsed) {
        toggleCollapsed();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isCollapsed, toggleCollapsed]);

  const deferredSearching = useDeferredLoading(isSearching);
  const deferredListLoading = useDeferredLoading(listLoading);
  const deferredSessionLoading = useDeferredLoading(sessionLoading);

  useSSE({
    onSessionsChanged: useCallback(() => {
      refreshSessions();
      refreshProjects();
    }, [refreshSessions, refreshProjects]),
    onSessionUpdated: useCallback((sessionId: string) => {
      refreshSessions();
      if (sessionId === selectedId) {
        refreshSession();
      }
    }, [refreshSessions, selectedId, refreshSession]),
  });

  const handleUpdateTitle = useCallback(async (title: string) => {
    patchTitle(title);
    await updateTitle(title);
    refreshSessions();
  }, [patchTitle, updateTitle, refreshSessions]);

  const handleDeleteSession = useCallback(async (id: string) => {
    await deleteSession(id);
    if (id === selectedId) setSelectedId(null);
    refreshSessions();
    showToast('Session archived', () => {
      restoreSession(id).then(() => refreshSessions());
    });
  }, [selectedId, refreshSessions, showToast]);

  const handleRestoreSession = useCallback(async (id: string) => {
    await restoreSession(id);
    refreshSessions();
    showToast('Session restored');
  }, [refreshSessions, showToast]);

  const handleExportSession = useCallback(async (id?: string) => {
    const exportId = id || selectedId;
    if (!exportId) return;
    try {
      const blob = await exportSession(exportId, theme);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chronicle-${exportId.slice(0, 8)}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast('Export failed');
    }
  }, [selectedId, theme, showToast]);

  const handleRenameSession = useCallback(async (id: string) => {
    const target = sessions.find((s) => s.id === id);
    const currentTitle = target?.title || target?.projectName || '';
    const input = window.prompt('Rename session', currentTitle);
    if (input === null) return;

    const title = input.trim();
    try {
      await updateMetadata(id, { title });
      if (id === selectedId) patchTitle(title);
      refreshSessions();
      showToast(title ? 'Session renamed' : 'Session title cleared');
    } catch {
      showToast('Rename failed');
    }
  }, [sessions, selectedId, patchTitle, refreshSessions, showToast]);

  return (
    <ThemeComponentProvider value={themeComponents}>
      <ThemeWrapper>
        <div className="app">
          <Toolbar
            theme={theme}
            onThemeChange={setTheme}
            sessionTitle={session?.info.title || session?.info.projectName}
            onExport={session ? () => handleExportSession() : undefined}
            hasSession={!!session}
            isCollapsed={isCollapsed}
            onToggleCollapsed={toggleCollapsed}
            version={buildInfo?.version}
            branch={buildInfo?.branch}
            onUndo={session ? undo : undefined}
            onRedo={session ? redo : undefined}
            canUndo={canUndo}
            canRedo={canRedo}
            collapseThinking={collapseThinking}
            onToggleCollapseThinking={session ? () => setCollapseThinking((v) => !v) : undefined}
            collapseToolResults={collapseToolResults}
            onToggleCollapseToolResults={session ? () => setCollapseToolResults((v) => !v) : undefined}
            showHidden={showHiddenBlocks}
            onToggleShowHidden={session ? () => setShowHiddenBlocks((v) => !v) : undefined}
            hasDeleteEdits={hasDeleteEdits}
            saveState={saveState}
          />
          <div className={`app__main${isDragging ? ' app__main--dragging' : ''}`}>
            <div
              className={`app__sidebar${isCollapsed ? ' app__sidebar--collapsed' : ''}`}
              style={isCollapsed ? undefined : { width: sidebarWidth }}
            >
              <SessionFilters
                searchTerm={searchTerm}
                projectFilter={projectFilter}
                projects={projects}
                onSearchChange={setSearchTerm}
                onProjectChange={setProjectFilter}
                isSearching={deferredSearching}
                showDeleted={showDeletedSessions}
                onShowDeletedChange={setShowDeletedSessions}
              />
              {deferredListLoading ? (
                <div className="app__loading">Loading sessions...</div>
              ) : listError ? (
                <div className="app__error">{listError}</div>
              ) : (
                <SessionList
                  sessions={sessions}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onDelete={handleDeleteSession}
                  onRestore={handleRestoreSession}
                  onRename={handleRenameSession}
                  onExport={(id) => handleExportSession(id)}
                />
              )}
            </div>
            <div
              className={`app__divider${isDragging ? ' app__divider--active' : ''}${isCollapsed ? ' app__divider--collapsed' : ''}`}
              {...dividerProps}
            >
              <button
                className="app__divider-chevron"
                onClick={(e) => {
                  e.stopPropagation();
                  if (hasMovedRef.current) {
                    hasMovedRef.current = false;
                    return;
                  }
                  toggleCollapsed();
                }}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? '\u00BB' : '\u00AB'}
              </button>
            </div>
            <div className="app__content">
              {!selectedId ? (
                <div className="app__empty">Select a session to view</div>
              ) : deferredSessionLoading ? (
                <div className="app__loading">Loading session...</div>
              ) : sessionError ? (
                <div className="app__error">{sessionError}</div>
              ) : session ? (
                <SessionViewer
                  session={session}
                  manifest={manifest}
                  onAddEdit={addEdit}
                  onRemoveEdit={removeEdit}
                  onUndo={undo}
                  onRedo={redo}
                  onUpdateTitle={handleUpdateTitle}
                  showDeleted={showHiddenBlocks}
                  collapseThinking={collapseThinking}
                  collapseToolResults={collapseToolResults}
                  onToast={showToast}
                />
              ) : null}
            </div>
          </div>
          <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </div>
      </ThemeWrapper>
    </ThemeComponentProvider>
  );
}
