import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeferredLoading } from './useDeferredLoading';

describe('useDeferredLoading', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false initially even when loading is true', () => {
    const { result } = renderHook(() => useDeferredLoading(true));
    expect(result.current).toBe(false);
  });

  it('returns true after showDelay elapses', () => {
    const { result } = renderHook(() => useDeferredLoading(true));

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe(true);
  });

  it('never shows if loading finishes before delay', () => {
    const { result, rerender } = renderHook(
      ({ loading }) => useDeferredLoading(loading),
      { initialProps: { loading: true } },
    );

    // Finish loading at 100ms — well before the 300ms delay
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ loading: false });

    // Advance past the original delay
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe(false);
  });

  it('hides immediately when loading finishes after being shown (no minDuration)', () => {
    const { result, rerender } = renderHook(
      ({ loading }) => useDeferredLoading(loading),
      { initialProps: { loading: true } },
    );

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe(true);

    rerender({ loading: false });
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(result.current).toBe(false);
  });

  it('holds visible for minDuration once shown', () => {
    const { result, rerender } = renderHook(
      ({ loading }) => useDeferredLoading(loading, { showDelay: 300, minDuration: 500 }),
      { initialProps: { loading: true } },
    );

    // Show after delay
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe(true);

    // Loading finishes 100ms after showing
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ loading: false });

    // Still visible — 400ms of minDuration remaining
    expect(result.current).toBe(true);

    // After remaining minDuration, hides
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(result.current).toBe(false);
  });

  it('rapid toggling does not cause a flash', () => {
    const { result, rerender } = renderHook(
      ({ loading }) => useDeferredLoading(loading),
      { initialProps: { loading: false } },
    );

    // Rapid on/off cycles
    for (let i = 0; i < 5; i++) {
      rerender({ loading: true });
      act(() => {
        vi.advanceTimersByTime(50);
      });
      rerender({ loading: false });
    }

    // Should never have shown
    expect(result.current).toBe(false);
  });

  it('respects custom showDelay', () => {
    const { result } = renderHook(() =>
      useDeferredLoading(true, { showDelay: 100 }),
    );

    act(() => {
      vi.advanceTimersByTime(99);
    });
    expect(result.current).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe(true);
  });

  it('returns false when loading is false', () => {
    const { result } = renderHook(() => useDeferredLoading(false));
    expect(result.current).toBe(false);
  });

  it('cleans up timers on unmount', () => {
    const { unmount } = renderHook(() => useDeferredLoading(true));

    unmount();

    // No errors when timers fire after unmount
    act(() => {
      vi.advanceTimersByTime(1000);
    });
  });

  it('re-shows after hiding if loading starts again', () => {
    const { result, rerender } = renderHook(
      ({ loading }) => useDeferredLoading(loading),
      { initialProps: { loading: true } },
    );

    // Show
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe(true);

    // Hide
    rerender({ loading: false });
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(result.current).toBe(false);

    // Start loading again
    rerender({ loading: true });
    expect(result.current).toBe(false);

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe(true);
  });

  it('cancels hide timer if loading restarts during minDuration hold', () => {
    const { result, rerender } = renderHook(
      ({ loading }) => useDeferredLoading(loading, { showDelay: 300, minDuration: 500 }),
      { initialProps: { loading: true } },
    );

    // Show
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe(true);

    // Stop loading — minDuration hold begins
    rerender({ loading: false });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe(true);

    // Loading restarts — should stay visible, not hide
    rerender({ loading: true });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe(true);
  });

  it('defaults showDelay to 300ms', () => {
    const { result } = renderHook(() => useDeferredLoading(true));

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe(true);
  });
});
