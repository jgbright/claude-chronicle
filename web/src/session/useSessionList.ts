import { useState, useEffect } from 'react';
import type { SessionInfo } from './types';
import { fetchSessions } from './api';

export function useSessionList() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions()
      .then(setSessions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { sessions, loading, error };
}
