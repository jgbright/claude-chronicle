import { useEffect, useRef } from 'react';

interface SSEEvent {
  type: 'sessions_changed' | 'session_updated';
  sessionId?: string;
}

interface UseSSEOptions {
  onSessionsChanged: () => void;
  onSessionUpdated: (sessionId: string) => void;
}

/**
 * Connects to the SSE endpoint and dispatches events to callbacks.
 * Uses refs for callbacks to avoid recreating the EventSource on re-renders.
 */
export function useSSE({ onSessionsChanged, onSessionUpdated }: UseSSEOptions) {
  const onSessionsChangedRef = useRef(onSessionsChanged);
  const onSessionUpdatedRef = useRef(onSessionUpdated);

  useEffect(() => {
    onSessionsChangedRef.current = onSessionsChanged;
    onSessionUpdatedRef.current = onSessionUpdated;
  });

  useEffect(() => {
    const source = new EventSource('/api/events');

    source.onmessage = (e) => {
      try {
        const data: SSEEvent = JSON.parse(e.data);
        if (data.type === 'sessions_changed') {
          onSessionsChangedRef.current();
        } else if (data.type === 'session_updated' && data.sessionId) {
          onSessionUpdatedRef.current(data.sessionId);
        }
      } catch {
        // Ignore malformed events
      }
    };

    return () => {
      source.close();
    };
  }, []);
}
