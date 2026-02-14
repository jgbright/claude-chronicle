import { useState, useEffect, useCallback, useRef } from 'react';
import type { SessionInfo } from './types';
import { fetchSessions } from './api';

export function useSessionList(searchTerm = '', projectFilter = '', showDeleted = false) {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [pendingFetches, setPendingFetches] = useState(0);
  const fetchIdRef = useRef(0);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch sessions when filters change
  useEffect(() => {
    const id = ++fetchIdRef.current;

    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (projectFilter) params.set('project', projectFilter);
    if (showDeleted) params.set('deleted', 'true');

    // Use microtask to avoid synchronous setState in effect body
    Promise.resolve()
      .then(() => setPendingFetches((n) => n + 1))
      .then(() => fetchSessions(params.toString() ? params : undefined))
      .then((data) => {
        if (id === fetchIdRef.current) setSessions(data);
      })
      .catch((e) => {
        if (id === fetchIdRef.current) setError(e.message);
      })
      .finally(() => {
        setPendingFetches((n) => n - 1);
        if (id === fetchIdRef.current) setLoading(false);
      });
  }, [debouncedSearch, projectFilter, showDeleted]);

  const refresh = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (projectFilter) params.set('project', projectFilter);
    if (showDeleted) params.set('deleted', 'true');

    fetchSessions(params.toString() ? params : undefined)
      .then(setSessions)
      .catch((e) => setError(e.message));
  }, [debouncedSearch, projectFilter, showDeleted]);

  const isSearching = pendingFetches > 0;

  return { sessions, loading, error, refresh, isSearching };
}
