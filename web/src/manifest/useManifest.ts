import { useState, useEffect, useCallback, useRef } from 'react';
import type { EditManifest, Edit } from './types';
import { fetchManifest, saveManifest, addEdit, removeEdit, updateMetadata } from './api';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function useManifest(sessionId: string | null, initialManifest?: EditManifest | null) {
  const [manifest, setManifest] = useState<EditManifest | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const redoStackRef = useRef<Edit[]>([]);
  const pendingRef = useRef(false);
  const savingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    setManifest(null);
    redoStackRef.current = [];
    setSaveState('idle');

    if (initialManifest) {
      setManifest(initialManifest);
      setLoadedId(sessionId);
      return;
    }

    fetchManifest(sessionId)
      .then((data) => {
        setManifest(data);
        setLoadedId(sessionId);
      })
      .catch(() => {
        setManifest({ version: 1, sessionId, edits: [] });
        setLoadedId(sessionId);
      });
  }, [sessionId, initialManifest]);

  const loading = sessionId !== null && loadedId !== sessionId;

  const trackSave = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    // Show "Saving..." only if it takes >300ms
    if (savingTimerRef.current) clearTimeout(savingTimerRef.current);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savingTimerRef.current = setTimeout(() => setSaveState('saving'), 300);
    try {
      const result = await fn();
      if (savingTimerRef.current) clearTimeout(savingTimerRef.current);
      setSaveState('saved');
      savedTimerRef.current = setTimeout(() => setSaveState('idle'), 2000);
      return result;
    } catch (err) {
      if (savingTimerRef.current) clearTimeout(savingTimerRef.current);
      setSaveState('error');
      throw err;
    }
  }, []);

  const save = useCallback(async (m: EditManifest) => {
    if (!sessionId) return;
    const saved = await trackSave(() => saveManifest(sessionId, m));
    setManifest(saved);
  }, [sessionId, trackSave]);

  const addEditAction = useCallback(async (edit: Edit) => {
    if (!sessionId) return;
    redoStackRef.current = [];
    const updated = await trackSave(() => addEdit(sessionId, edit));
    setManifest(updated);
  }, [sessionId, trackSave]);

  const removeEditAction = useCallback(async (index: number) => {
    if (!sessionId) return;
    const updated = await trackSave(() => removeEdit(sessionId, index));
    setManifest(updated);
  }, [sessionId, trackSave]);

  const undo = useCallback(async () => {
    if (!sessionId || !manifest || manifest.edits.length === 0) return;
    if (pendingRef.current) return;
    pendingRef.current = true;
    try {
      const lastEdit = manifest.edits[manifest.edits.length - 1];
      const lastIndex = manifest.edits.length - 1;
      const updated = await trackSave(() => removeEdit(sessionId, lastIndex));
      redoStackRef.current.push(lastEdit);
      setManifest(updated);
    } finally {
      pendingRef.current = false;
    }
  }, [sessionId, manifest, trackSave]);

  const redo = useCallback(async () => {
    if (!sessionId || redoStackRef.current.length === 0) return;
    if (pendingRef.current) return;
    pendingRef.current = true;
    try {
      const edit = redoStackRef.current.pop()!;
      const updated = await trackSave(() => addEdit(sessionId, edit));
      setManifest(updated);
    } finally {
      pendingRef.current = false;
    }
  }, [sessionId, trackSave]);

  const updateTitle = useCallback(async (title: string) => {
    if (!sessionId) return;
    const updated = await trackSave(() => updateMetadata(sessionId, { title }));
    setManifest(updated);
  }, [sessionId, trackSave]);

  const canUndo = !!manifest && manifest.edits.length > 0;
  const canRedo = redoStackRef.current.length > 0;

  return {
    manifest: sessionId ? manifest : null,
    loading,
    save,
    addEdit: addEditAction,
    removeEdit: removeEditAction,
    undo,
    redo,
    canUndo,
    canRedo,
    updateTitle,
    saveState,
  };
}
