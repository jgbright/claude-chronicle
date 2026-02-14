import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSessionData } from './useSessionData';
import * as api from './api';
import { createParsedSession } from '../test/factories';

vi.mock('./api');

const mockedApi = vi.mocked(api);

beforeEach(() => {
  vi.resetAllMocks();
});

describe('useSessionData', () => {
  it('returns null session when id is null', () => {
    const { result } = renderHook(() => useSessionData(null));
    expect(result.current.session).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('fetches session data when id is provided', async () => {
    const session = createParsedSession();
    mockedApi.fetchSession.mockResolvedValue(session);
    const { result } = renderHook(() => useSessionData('s1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toEqual(session);
    expect(mockedApi.fetchSession).toHaveBeenCalledWith('s1');
  });

  it('starts loading when id is provided', () => {
    mockedApi.fetchSession.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useSessionData('s1'));
    expect(result.current.loading).toBe(true);
  });

  it('sets error on fetch failure', async () => {
    mockedApi.fetchSession.mockRejectedValue(new Error('Not found'));
    const { result } = renderHook(() => useSessionData('bad-id'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Not found');
  });

  it('resets session when id changes to null', async () => {
    const session = createParsedSession();
    mockedApi.fetchSession.mockResolvedValue(session);
    const { result, rerender } = renderHook(
      ({ id }) => useSessionData(id),
      { initialProps: { id: 's1' as string | null } }
    );
    await waitFor(() => expect(result.current.session).toEqual(session));
    rerender({ id: null });
    expect(result.current.session).toBeNull();
  });

  it('refetches when id changes', async () => {
    const session1 = createParsedSession();
    const session2 = createParsedSession();
    mockedApi.fetchSession
      .mockResolvedValueOnce(session1)
      .mockResolvedValueOnce(session2);
    const { result, rerender } = renderHook(
      ({ id }) => useSessionData(id),
      { initialProps: { id: 's1' as string | null } }
    );
    await waitFor(() => expect(result.current.session).toEqual(session1));
    rerender({ id: 's2' });
    await waitFor(() => expect(result.current.session).toEqual(session2));
    expect(mockedApi.fetchSession).toHaveBeenCalledTimes(2);
  });

  it('patchTitle survives refresh for the same session', async () => {
    const session = createParsedSession({
      info: { id: 's1', title: 'Old', projectName: 'proj', filePath: '/f', modTime: '', sizeBytes: 0 },
    });
    mockedApi.fetchSession.mockResolvedValue(session);
    const { result } = renderHook(() => useSessionData('s1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session!.info.title).toBe('Old');

    // Optimistically patch the title
    act(() => result.current.patchTitle('New Title'));
    expect(result.current.session!.info.title).toBe('New Title');

    // Simulate SSE-triggered refresh returning stale data
    const staleSession = createParsedSession({
      info: { id: 's1', title: 'Old', projectName: 'proj', filePath: '/f', modTime: '', sizeBytes: 0 },
    });
    mockedApi.fetchSession.mockResolvedValue(staleSession);
    act(() => result.current.refresh());
    await waitFor(() => expect(mockedApi.fetchSession).toHaveBeenCalledTimes(2));

    // Title should still be the patched value, not the stale server value
    expect(result.current.session!.info.title).toBe('New Title');
  });

  it('title override clears when switching sessions', async () => {
    const session1 = createParsedSession({
      info: { id: 's1', title: 'Title 1', projectName: 'proj', filePath: '/f', modTime: '', sizeBytes: 0 },
    });
    mockedApi.fetchSession.mockResolvedValue(session1);
    const { result, rerender } = renderHook(
      ({ id }) => useSessionData(id),
      { initialProps: { id: 's1' as string | null } }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Patch title for session 1
    act(() => result.current.patchTitle('Patched'));
    expect(result.current.session!.info.title).toBe('Patched');

    // Switch to session 2
    const session2 = createParsedSession({
      info: { id: 's2', title: 'Title 2', projectName: 'proj', filePath: '/f', modTime: '', sizeBytes: 0 },
    });
    mockedApi.fetchSession.mockResolvedValue(session2);
    rerender({ id: 's2' });
    await waitFor(() => expect(result.current.session!.info.title).toBe('Title 2'));

    // Session 2 should NOT use session 1's patched title
    expect(result.current.session!.info.title).toBe('Title 2');
  });
});
