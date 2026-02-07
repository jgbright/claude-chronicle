import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchManifest, saveManifest, addEdit, removeEdit } from './api';
import { createManifest } from '../test/factories';

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

describe('fetchManifest', () => {
  it('fetches from /api/sessions/{id}/manifest', async () => {
    const manifest = createManifest();
    global.fetch = mockFetch(manifest);
    const result = await fetchManifest('abc-123');
    expect(global.fetch).toHaveBeenCalledWith('/api/sessions/abc-123/manifest');
    expect(result).toEqual(manifest);
  });

  it('throws on non-ok response', async () => {
    global.fetch = mockFetch(null, false, 'Error');
    await expect(fetchManifest('x')).rejects.toThrow('Failed to fetch manifest');
  });
});

describe('saveManifest', () => {
  it('sends PUT to /api/sessions/{id}/manifest', async () => {
    const manifest = createManifest({ sessionId: 's1' });
    global.fetch = mockFetch(manifest);
    const result = await saveManifest('s1', manifest);
    expect(global.fetch).toHaveBeenCalledWith('/api/sessions/s1/manifest', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(manifest),
    });
    expect(result).toEqual(manifest);
  });

  it('throws on non-ok response', async () => {
    global.fetch = mockFetch(null, false, 'Bad Request');
    await expect(saveManifest('s1', createManifest())).rejects.toThrow('Failed to save manifest');
  });
});

describe('addEdit', () => {
  it('sends POST to /api/sessions/{id}/manifest/edits', async () => {
    const manifest = createManifest();
    const edit = { type: 'delete' as const, blockId: 'b1' };
    global.fetch = mockFetch(manifest);
    const result = await addEdit('s1', edit);
    expect(global.fetch).toHaveBeenCalledWith('/api/sessions/s1/manifest/edits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(edit),
    });
    expect(result).toEqual(manifest);
  });

  it('throws on non-ok response', async () => {
    global.fetch = mockFetch(null, false, 'Error');
    await expect(addEdit('s1', { type: 'delete', blockId: 'b1' })).rejects.toThrow('Failed to add edit');
  });
});

describe('removeEdit', () => {
  it('sends DELETE to /api/sessions/{id}/manifest/edits/{index}', async () => {
    const manifest = createManifest();
    global.fetch = mockFetch(manifest);
    const result = await removeEdit('s1', 2);
    expect(global.fetch).toHaveBeenCalledWith('/api/sessions/s1/manifest/edits/2', {
      method: 'DELETE',
    });
    expect(result).toEqual(manifest);
  });

  it('throws on non-ok response', async () => {
    global.fetch = mockFetch(null, false, 'Error');
    await expect(removeEdit('s1', 0)).rejects.toThrow('Failed to remove edit');
  });
});
