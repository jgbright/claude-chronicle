import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
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
});
