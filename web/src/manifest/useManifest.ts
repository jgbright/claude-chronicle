import { useState, useEffect, useCallback, useRef } from 'react';
import type { EditManifest, Edit } from './types';
import { fetchManifest, saveManifest, addEdit, removeEdit } from './api';

export function useManifest(sessionId: string | null) {
  const [manifest, setManifest] = useState<EditManifest | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const redoStackRef = useRef<Edit[]>([]);
  const pendingRef = useRef(false);

  useEffect(() => {
    if (!sessionId) return;

    // Clear stale state on session change
    setManifest(null);
    redoStackRef.current = [];

    fetchManifest(sessionId)
      .then((data) => {
        setManifest(data);
        setLoadedId(sessionId);
      })
      .catch(() => {
        setManifest({ version: 1, sessionId, edits: [] });
        setLoadedId(sessionId);
      });
  }, [sessionId]);

  const loading = sessionId !== null && loadedId !== sessionId;

  const save = useCallback(async (m: EditManifest) => {
    if (!sessionId) return;
    const saved = await saveManifest(sessionId, m);
    setManifest(saved);
  }, [sessionId]);

  const addEditAction = useCallback(async (edit: Edit) => {
    if (!sessionId) return;
    // New edit clears redo stack
    redoStackRef.current = [];
    const updated = await addEdit(sessionId, edit);
    setManifest(updated);
  }, [sessionId]);

  const removeEditAction = useCallback(async (index: number) => {
    if (!sessionId) return;
    const updated = await removeEdit(sessionId, index);
    setManifest(updated);
  }, [sessionId]);

  const undo = useCallback(async () => {
    if (!sessionId || !manifest || manifest.edits.length === 0) return;
    if (pendingRef.current) return;
    pendingRef.current = true;
    try {
      const lastEdit = manifest.edits[manifest.edits.length - 1];
      const lastIndex = manifest.edits.length - 1;
      const updated = await removeEdit(sessionId, lastIndex);
      redoStackRef.current.push(lastEdit);
      setManifest(updated);
    } finally {
      pendingRef.current = false;
    }
  }, [sessionId, manifest]);

  const redo = useCallback(async () => {
    if (!sessionId || redoStackRef.current.length === 0) return;
    if (pendingRef.current) return;
    pendingRef.current = true;
    try {
      const edit = redoStackRef.current.pop()!;
      const updated = await addEdit(sessionId, edit);
      setManifest(updated);
    } finally {
      pendingRef.current = false;
    }
  }, [sessionId]);

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
  };
}
