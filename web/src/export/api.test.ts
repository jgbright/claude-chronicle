import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportSession } from './api';

function mockFetch(data: unknown, ok = true, statusText = 'OK') {
  return vi.fn().mockResolvedValue({
    ok,
    statusText,
    json: () => Promise.resolve(data),
    blob: () => Promise.resolve(new Blob(['html'])),
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('exportSession', () => {
  it('sends POST to /api/sessions/{id}/export with theme', async () => {
    global.fetch = mockFetch(null);
    const result = await exportSession('s1', 'copilot');
    expect(global.fetch).toHaveBeenCalledWith('/api/sessions/s1/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: 'copilot' }),
    });
    expect(result).toBeInstanceOf(Blob);
  });

  it('throws on non-ok response', async () => {
    global.fetch = mockFetch(null, false, 'Error');
    await expect(exportSession('s1', 'claude')).rejects.toThrow('Failed to export');
  });
});
