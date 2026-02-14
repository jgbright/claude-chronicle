import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBuildInfo } from './useBuildInfo';

describe('useBuildInfo', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns fetched build info', async () => {
    const mockInfo = { version: '0.1.0', commit: 'abc', date: '2025-01-15', branch: 'feat/test' };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockInfo),
    });

    const { result } = renderHook(() => useBuildInfo());

    await waitFor(() => {
      expect(result.current).toEqual(mockInfo);
    });
  });

  it('returns null on fetch error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useBuildInfo());

    // Give it time to settle — should remain null
    await new Promise((r) => setTimeout(r, 50));
    expect(result.current).toBeNull();
  });

  it('returns null on non-ok response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useBuildInfo());

    await new Promise((r) => setTimeout(r, 50));
    expect(result.current).toBeNull();
  });
});
