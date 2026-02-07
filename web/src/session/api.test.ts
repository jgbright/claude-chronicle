import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchSessions, fetchSession } from './api';
import { createSessionInfo } from '../test/factories';

function mockFetch(data: unknown, ok = true, statusText = 'OK') {
  return vi.fn().mockResolvedValue({
    ok,
    statusText,
    json: () => Promise.resolve(data),
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('fetchSessions', () => {
  it('fetches from /api/sessions', async () => {
    const sessions = [createSessionInfo()];
    global.fetch = mockFetch(sessions);
    const result = await fetchSessions();
    expect(global.fetch).toHaveBeenCalledWith('/api/sessions');
    expect(result).toEqual(sessions);
  });

  it('throws on non-ok response', async () => {
    global.fetch = mockFetch(null, false, 'Internal Server Error');
    await expect(fetchSessions()).rejects.toThrow('Failed to fetch sessions: Internal Server Error');
  });
});

describe('fetchSession', () => {
  it('fetches from /api/sessions/{id}', async () => {
    const data = { info: createSessionInfo(), messages: [] };
    global.fetch = mockFetch(data);
    const result = await fetchSession('abc-123');
    expect(global.fetch).toHaveBeenCalledWith('/api/sessions/abc-123');
    expect(result).toEqual(data);
  });

  it('throws on non-ok response', async () => {
    global.fetch = mockFetch(null, false, 'Not Found');
    await expect(fetchSession('bad')).rejects.toThrow('Failed to fetch session: Not Found');
  });
});
