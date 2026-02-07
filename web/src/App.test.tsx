import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('./session/useSessionList');
vi.mock('./session/useSessionData');
vi.mock('./manifest/useManifest');
vi.mock('./themes/useTheme');
vi.mock('./export/api');

import App from './shell/App';
import { useSessionList } from './session/useSessionList';
import { useSessionData } from './session/useSessionData';
import { useManifest } from './manifest/useManifest';
import { useTheme } from './themes/useTheme';
import { exportSession } from './export/api';
import { createParsedSession, createSessionInfo } from './test/factories';

describe('App', () => {
  beforeEach(() => {
    vi.mocked(useTheme).mockReturnValue({ theme: 'claude', setTheme: vi.fn() });
    vi.mocked(useSessionList).mockReturnValue({ sessions: [], loading: false, error: null });
    vi.mocked(useSessionData).mockReturnValue({ session: null, loading: false, error: null });
    vi.mocked(useManifest).mockReturnValue({
      manifest: null,
      loading: false,
      save: vi.fn(),
      addEdit: vi.fn(),
      removeEdit: vi.fn(),
    });
  });

  it('shows loading state for session list', () => {
    vi.mocked(useSessionList).mockReturnValue({ sessions: [], loading: true, error: null });
    render(<App />);
    expect(screen.getByText('Loading sessions...')).toBeInTheDocument();
  });

  it('shows error state for session list', () => {
    vi.mocked(useSessionList).mockReturnValue({
      sessions: [],
      loading: false,
      error: 'Failed to fetch sessions',
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
    vi.mocked(useSessionList).mockReturnValue({ sessions, loading: false, error: null });
    vi.mocked(useSessionData).mockReturnValue({ session: null, loading: true, error: null });

    render(<App />);
    await user.click(screen.getByText('Project One'));
    expect(screen.getByText('Loading session...')).toBeInTheDocument();
  });

  it('shows error state for selected session', async () => {
    const user = userEvent.setup();
    const sessions = [
      createSessionInfo({ id: 'sess-2', projectName: 'Project Two' }),
    ];
    vi.mocked(useSessionList).mockReturnValue({ sessions, loading: false, error: null });
    vi.mocked(useSessionData).mockReturnValue({
      session: null,
      loading: false,
      error: 'Session not found',
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
    vi.mocked(useSessionList).mockReturnValue({ sessions, loading: false, error: null });
    vi.mocked(useSessionData).mockReturnValue({ session, loading: false, error: null });

    const { container } = render(<App />);
    await user.click(screen.getByText('Project Three'));
    expect(container.querySelector('.session-viewer')).not.toBeNull();
  });

  it('renders session list with sessions', () => {
    const sessions = [
      createSessionInfo({ id: 'sess-a', projectName: 'Alpha' }),
      createSessionInfo({ id: 'sess-b', projectName: 'Beta' }),
    ];
    vi.mocked(useSessionList).mockReturnValue({ sessions, loading: false, error: null });

    render(<App />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('does not show edit controls by default', () => {
    const sessions = [
      createSessionInfo({ id: 'sess-4', projectName: 'Project Four' }),
    ];
    const session = createParsedSession();
    vi.mocked(useSessionList).mockReturnValue({ sessions, loading: false, error: null });
    vi.mocked(useSessionData).mockReturnValue({ session, loading: false, error: null });

    const { container } = render(<App />);
    expect(container.querySelector('.edit-controls')).toBeNull();
  });

  it('export calls exportSession and triggers download', async () => {
    const user = userEvent.setup();
    const sessions = [
      createSessionInfo({ id: 'sess-export1', projectName: 'Export Test' }),
    ];
    const session = createParsedSession();
    vi.mocked(useSessionList).mockReturnValue({ sessions, loading: false, error: null });
    vi.mocked(useSessionData).mockReturnValue({ session, loading: false, error: null });

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
    const exportBtn = screen.getByText('Export HTML');
    await user.click(exportBtn);

    expect(vi.mocked(exportSession)).toHaveBeenCalledWith('sess-export1', 'claude');
    expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith(mockUrl);

    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
    vi.mocked(document.createElement).mockRestore();
  });

  it('export shows alert on failure', async () => {
    const user = userEvent.setup();
    const sessions = [
      createSessionInfo({ id: 'sess-fail', projectName: 'Fail Test' }),
    ];
    const session = createParsedSession();
    vi.mocked(useSessionList).mockReturnValue({ sessions, loading: false, error: null });
    vi.mocked(useSessionData).mockReturnValue({ session, loading: false, error: null });

    vi.mocked(exportSession).mockRejectedValue(new Error('Network error'));
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<App />);

    // Select session
    await user.click(screen.getByText('Fail Test'));

    // Click export
    const exportBtn = screen.getByText('Export HTML');
    await user.click(exportBtn);

    expect(alertSpy).toHaveBeenCalledWith('Export not yet available');
    alertSpy.mockRestore();
  });
});
