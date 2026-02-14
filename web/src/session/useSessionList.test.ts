import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSessionList } from './useSessionList';
import * as api from './api';
import { createSessionInfo } from '../test/factories';

vi.mock('./api');

const mockedApi = vi.mocked(api);

beforeEach(() => {
  vi.resetAllMocks();
});

describe('useSessionList', () => {
  it('starts in loading state', () => {
    mockedApi.fetchSessions.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useSessionList());
    expect(result.current.loading).toBe(true);
    expect(result.current.sessions).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('fetches sessions on mount', async () => {
    const sessions = [createSessionInfo({ id: 's1' })];
    mockedApi.fetchSessions.mockResolvedValue(sessions);
    const { result } = renderHook(() => useSessionList());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.sessions).toEqual(sessions);
    expect(result.current.error).toBeNull();
  });

  it('sets error on fetch failure', async () => {
    mockedApi.fetchSessions.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useSessionList());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Network error');
    expect(result.current.sessions).toEqual([]);
  });

  it('passes deleted=true param when showDeleted is true', async () => {
    const sessions = [createSessionInfo({ id: 's1' })];
    mockedApi.fetchSessions.mockResolvedValue(sessions);
    const { result } = renderHook(() => useSessionList('', '', true));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedApi.fetchSessions).toHaveBeenCalled();
    const lastCall = mockedApi.fetchSessions.mock.calls[mockedApi.fetchSessions.mock.calls.length - 1];
    const params = lastCall[0] as URLSearchParams;
    expect(params.get('deleted')).toBe('true');
  });

  it('does not pass deleted param when showDeleted is false', async () => {
    const sessions = [createSessionInfo({ id: 's1' })];
    mockedApi.fetchSessions.mockResolvedValue(sessions);
    const { result } = renderHook(() => useSessionList('', '', false));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedApi.fetchSessions).toHaveBeenCalled();
    const lastCall = mockedApi.fetchSessions.mock.calls[mockedApi.fetchSessions.mock.calls.length - 1];
    // When no params, fetchSessions is called with undefined
    expect(lastCall[0]).toBeUndefined();
  });
});
