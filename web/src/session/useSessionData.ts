import { useState, useEffect, useCallback, useRef } from 'react';
import type { ParsedSession } from './types';
import type { EditManifest } from '../manifest/types';
import { fetchSession } from './api';

export function useSessionData(id: string | null) {
  const [session, setSession] = useState<ParsedSession | null>(null);
  const [initialManifest, setInitialManifest] = useState<EditManifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  // Optimistic title override — survives SSE-triggered refreshes for the same session.
  // Cleared when switching to a different session.
  const titleOverrideRef = useRef<{ sessionId: string; title: string } | null>(null);

  const loadSession = useCallback((sessionId: string) => {
    fetchSession(sessionId)
      .then((data) => {
        const { manifest, ...sessionData } = data;
        // Preserve optimistic title if it was set for this session
        if (titleOverrideRef.current?.sessionId === sessionId) {
          sessionData.info = { ...sessionData.info, title: titleOverrideRef.current.title };
        }
        setSession(sessionData);
        setInitialManifest(manifest ?? null);
        setError(null);
        setLoadedId(sessionId);
      })
      .catch((e) => {
        setSession(null);
        setInitialManifest(null);
        setError(e.message);
        setLoadedId(sessionId);
      });
  }, []);

  // Clear title override when switching sessions
  useEffect(() => {
    titleOverrideRef.current = null;
  }, [id]);

  useEffect(() => {
    if (!id) return;
    loadSession(id);
  }, [id, loadSession]);

  const refresh = useCallback(() => {
    if (id) loadSession(id);
  }, [id, loadSession]);

  const patchTitle = useCallback((title: string) => {
    if (id) titleOverrideRef.current = { sessionId: id, title };
    setSession(prev => prev ? { ...prev, info: { ...prev.info, title } } : null);
  }, [id]);

  const loading = id !== null && loadedId !== id;
  return {
    session: id ? session : null,
    initialManifest: id ? initialManifest : null,
    loading,
    error: id ? error : null,
    refresh,
    patchTitle,
  };
}
