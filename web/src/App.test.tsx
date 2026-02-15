import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('./session/useSessionList');
vi.mock('./session/useSessionData');
vi.mock('./session/useSSE');
vi.mock('./session/useProjects');
vi.mock('./manifest/useManifest');
vi.mock('./themes/useTheme');
vi.mock('./export/api');
vi.mock('./manifest/api');
vi.mock('./hooks/useDeferredLoading', () => ({
  useDeferredLoading: (value: boolean) => value,
}));

import App from './shell/App';
import { useSessionList } from './session/useSessionList';
import { useSessionData } from './session/useSessionData';
import { useProjects } from './session/useProjects';
import { useManifest } from './manifest/useManifest';
import { useTheme } from './themes/useTheme';
import { exportSession } from './export/api';
import { updateMetadata } from './manifest/api';
import { createParsedSession, createSessionInfo } from './test/factories';

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTheme).mockReturnValue({ theme: 'claude', setTheme: vi.fn() });
    vi.mocked(useSessionList).mockReturnValue({ sessions: [], loading: false, error: null, refresh: vi.fn(), isSearching: false });
    vi.mocked(useSessionData).mockReturnValue({ session: null, initialManifest: null, loading: false, error: null, refresh: vi.fn(), patchTitle: vi.fn() });
    vi.mocked(useProjects).mockReturnValue({ projects: [], loading: false, error: null, refresh: vi.fn(), patchTitle: vi.fn() });
    vi.mocked(useManifest).mockReturnValue({
      manifest: null,
      loading: false,
      save: vi.fn(),
      addEdit: vi.fn(),
      removeEdit: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: false,
      canRedo: false,
      updateTitle: vi.fn(),
      saveState: 'idle',
    });
    vi.mocked(updateMetadata).mockResolvedValue({ version: 1, sessionId: 's1', edits: [] });
  });

  it('shows loading state for session list', () => {
    vi.mocked(useSessionList).mockReturnValue({ sessions: [], loading: true, error: null, refresh: vi.fn(), isSearching: false });
    render(<App />);
    expect(screen.getByText('Loading sessions...')).toBeInTheDocument();
  });

  it('shows error state for session list', () => {
    vi.mocked(useSessionList).mockReturnValue({
      sessions: [],
      loading: false,
      error: 'Failed to fetch sessions',
      refresh: vi.fn(),
      isSearching: false,
    });
    render(<App />);
    expect(screen.getByText('Failed to fetch sessions')).toBeInTheDocument();
  });

  it('shows empty session prompt when no session selected', () => {
    render(<App />);
    expect(screen.getByText('Select a session to view')).toBeInTheDocument();
  });

  it('shows loading state for selected session', async () => {
    const user = userEvent.setup();
    const sessions = [
      createSessionInfo({ id: 'sess-1', projectName: 'Project One' }),
    ];
    vi.mocked(useSessionList).mockReturnValue({ sessions, loading: false, error: null, refresh: vi.fn(), isSearching: false });
    vi.mocked(useSessionData).mockReturnValue({ session: null, initialManifest: null, loading: true, error: null, refresh: vi.fn(), patchTitle: vi.fn() });

    render(<App />);
    await user.click(screen.getByText('Project One'));
    expect(screen.getByText('Loading session...')).toBeInTheDocument();
  });

  it('shows error state for selected session', async () => {
    const user = userEvent.setup();
    const sessions = [
      createSessionInfo({ id: 'sess-2', projectName: 'Project Two' }),
    ];
    vi.mocked(useSessionList).mockReturnValue({ sessions, loading: false, error: null, refresh: vi.fn(), isSearching: false });
    vi.mocked(useSessionData).mockReturnValue({
      session: null,
      initialManifest: null,
      loading: false,
      error: 'Session not found',
      refresh: vi.fn(),
      patchTitle: vi.fn(),
    });

    render(<App />);
    await user.click(screen.getByText('Project Two'));
    expect(screen.getByText('Session not found')).toBeInTheDocument();
  });

  it('renders session viewer when session loaded', async () => {
    const user = userEvent.setup();
    const sessions = [
      createSessionInfo({ id: 'sess-3', projectName: 'Project Three' }),
    ];
    const session = createParsedSession();
    vi.mocked(useSessionList).mockReturnValue({ sessions, loading: false, error: null, refresh: vi.fn(), isSearching: false });
    vi.mocked(useSessionData).mockReturnValue({ session, initialManifest: null, loading: false, error: null, refresh: vi.fn(), patchTitle: vi.fn() });

    const { container } = render(<App />);
    await user.click(screen.getByText('Project Three'));
    expect(container.querySelector('.session-viewer')).not.toBeNull();
  });

  it('renders session list with sessions', () => {
    const sessions = [
      createSessionInfo({ id: 'sess-a', projectName: 'Alpha' }),
      createSessionInfo({ id: 'sess-b', projectName: 'Beta' }),
    ];
    vi.mocked(useSessionList).mockReturnValue({ sessions, loading: false, error: null, refresh: vi.fn(), isSearching: false });

    render(<App />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('shows hover actions instead of old edit controls', () => {
    const sessions = [
      createSessionInfo({ id: 'sess-4', projectName: 'Project Four' }),
    ];
    const session = createParsedSession();
    vi.mocked(useSessionList).mockReturnValue({ sessions, loading: false, error: null, refresh: vi.fn(), isSearching: false });
    vi.mocked(useSessionData).mockReturnValue({ session, initialManifest: null, loading: false, error: null, refresh: vi.fn(), patchTitle: vi.fn() });

    const { container } = render(<App />);
    expect(container.querySelector('.edit-controls')).toBeNull();
    expect(container.querySelectorAll('.message-actions').length).toBeGreaterThanOrEqual(0);
  });

  it('export calls exportSession and triggers download', async () => {
    const user = userEvent.setup();
    const sessions = [
      createSessionInfo({ id: 'sess-export1', projectName: 'Export Test' }),
    ];
    const session = createParsedSession();
    vi.mocked(useSessionList).mockReturnValue({ sessions, loading: false, error: null, refresh: vi.fn(), isSearching: false });
    vi.mocked(useSessionData).mockReturnValue({ session, initialManifest: null, loading: false, error: null, refresh: vi.fn(), patchTitle: vi.fn() });

    const mockBlob = new Blob(['<html>test</html>'], { type: 'text/html' });
    vi.mocked(exportSession).mockResolvedValue(mockBlob);

    const mockUrl = 'blob:http://localhost/fake-url';
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockUrl);
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') {
        el.click = clickSpy;
      }
      return el;
    });

    render(<App />);

    // Click a session to select it (so export button appears)
    await user.click(screen.getByText('Export Test'));

    // Click the export button
    const exportBtn = screen.getByText('Export');
    await user.click(exportBtn);

    expect(vi.mocked(exportSession)).toHaveBeenCalledWith('sess-export1', 'claude');
    expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith(mockUrl);

    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
    vi.mocked(document.createElement).mockRestore();
  });

  it('export shows toast on failure', async () => {
    const user = userEvent.setup();
    const sessions = [
      createSessionInfo({ id: 'sess-fail', projectName: 'Fail Test' }),
    ];
    const session = createParsedSession();
    vi.mocked(useSessionList).mockReturnValue({ sessions, loading: false, error: null, refresh: vi.fn(), isSearching: false });
    vi.mocked(useSessionData).mockReturnValue({ session, initialManifest: null, loading: false, error: null, refresh: vi.fn(), patchTitle: vi.fn() });

    vi.mocked(exportSession).mockRejectedValue(new Error('Network error'));

    render(<App />);

    // Select session
    await user.click(screen.getByText('Fail Test'));

    // Click export
    const exportBtn = screen.getByText('Export');
    await user.click(exportBtn);

    // Should show a toast with failure message instead of alert
    expect(screen.getByText('Export failed')).toBeInTheDocument();
  });

  it('right-click Rename updates session title metadata', async () => {
    const user = userEvent.setup();
    const sessions = [
      createSessionInfo({ id: 'sess-rename', projectName: 'Rename Project', title: 'Old Title' }),
    ];
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('New Title');
    const refresh = vi.fn();
    vi.mocked(useSessionList).mockReturnValue({ sessions, loading: false, error: null, refresh, isSearching: false });

    render(<App />);

    await user.click(screen.getByTitle('Session actions'));
    await user.click(screen.getByText('Rename'));

    expect(promptSpy).toHaveBeenCalledWith('Rename session', 'Old Title');
    expect(vi.mocked(updateMetadata)).toHaveBeenCalledWith('sess-rename', { title: 'New Title' });
    expect(refresh).toHaveBeenCalled();
    expect(screen.getByText('Session renamed')).toBeInTheDocument();

    promptSpy.mockRestore();
  });
});
