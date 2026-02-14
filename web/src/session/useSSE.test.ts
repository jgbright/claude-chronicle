import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSSE } from './useSSE';

// Mock EventSource
class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  onmessage: ((e: MessageEvent) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  close = vi.fn();

  // Helper to simulate a message
  simulateMessage(data: string) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data }));
    }
  }
}

beforeEach(() => {
  MockEventSource.instances = [];
  vi.stubGlobal('EventSource', MockEventSource);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useSSE', () => {
  it('connects to /api/events', () => {
    renderHook(() =>
      useSSE({ onSessionsChanged: vi.fn(), onSessionUpdated: vi.fn() })
    );

    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0].url).toBe('/api/events');
  });

  it('calls onSessionsChanged for sessions_changed events', () => {
    const onSessionsChanged = vi.fn();
    renderHook(() =>
      useSSE({ onSessionsChanged, onSessionUpdated: vi.fn() })
    );

    MockEventSource.instances[0].simulateMessage(
      JSON.stringify({ type: 'sessions_changed' })
    );

    expect(onSessionsChanged).toHaveBeenCalledOnce();
  });

  it('calls onSessionUpdated for session_updated events', () => {
    const onSessionUpdated = vi.fn();
    renderHook(() =>
      useSSE({ onSessionsChanged: vi.fn(), onSessionUpdated })
    );

    MockEventSource.instances[0].simulateMessage(
      JSON.stringify({ type: 'session_updated', sessionId: 'abc-123' })
    );

    expect(onSessionUpdated).toHaveBeenCalledWith('abc-123');
  });

  it('ignores malformed events', () => {
    const onSessionsChanged = vi.fn();
    const onSessionUpdated = vi.fn();
    renderHook(() =>
      useSSE({ onSessionsChanged, onSessionUpdated })
    );

    MockEventSource.instances[0].simulateMessage('not json');

    expect(onSessionsChanged).not.toHaveBeenCalled();
    expect(onSessionUpdated).not.toHaveBeenCalled();
  });

  it('closes EventSource on unmount', () => {
    const { unmount } = renderHook(() =>
      useSSE({ onSessionsChanged: vi.fn(), onSessionUpdated: vi.fn() })
    );

    const source = MockEventSource.instances[0];
    unmount();

    expect(source.close).toHaveBeenCalledOnce();
  });

  it('does not recreate EventSource when callbacks change', () => {
    const { rerender } = renderHook(
      ({ cb }) =>
        useSSE({ onSessionsChanged: cb, onSessionUpdated: vi.fn() }),
      { initialProps: { cb: vi.fn() } }
    );

    rerender({ cb: vi.fn() });

    expect(MockEventSource.instances).toHaveLength(1);
  });
});
