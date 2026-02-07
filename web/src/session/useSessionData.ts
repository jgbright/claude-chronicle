import { useState, useEffect } from 'react';
import type { ParsedSession } from './types';
import { fetchSession } from './api';

export function useSessionData(id: string | null) {
  const [session, setSession] = useState<ParsedSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    fetchSession(id)
      .then((data) => {
        setSession(data);
        setError(null);
        setLoadedId(id);
      })
      .catch((e) => {
        setSession(null);
        setError(e.message);
        setLoadedId(id);
      });
  }, [id]);

  const loading = id !== null && loadedId !== id;
  return { session: id ? session : null, loading, error: id ? error : null };
}
