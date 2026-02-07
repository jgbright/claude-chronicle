import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useManifest } from './useManifest';
import * as client from './api';
import { createManifest } from '../test/factories';

vi.mock('./api');

const mockedClient = vi.mocked(client);

beforeEach(() => {
  vi.resetAllMocks();
});

describe('useManifest', () => {
  it('returns null manifest when sessionId is null', () => {
    const { result } = renderHook(() => useManifest(null));
    expect(result.current.manifest).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('fetches manifest when sessionId is provided', async () => {
    const manifest = createManifest({ sessionId: 's1' });
    mockedClient.fetchManifest.mockResolvedValue(manifest);
    const { result } = renderHook(() => useManifest('s1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.manifest).toEqual(manifest);
    expect(mockedClient.fetchManifest).toHaveBeenCalledWith('s1');
  });

  it('creates fallback manifest on fetch error', async () => {
    mockedClient.fetchManifest.mockRejectedValue(new Error('Not found'));
    const { result } = renderHook(() => useManifest('s1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.manifest).toEqual({
      version: 1,
      sessionId: 's1',
      edits: [],
    });
  });

  it('addEdit calls API and updates manifest', async () => {
    const initial = createManifest({ sessionId: 's1', edits: [] });
    const updated = createManifest({
      sessionId: 's1',
      edits: [{ type: 'delete', blockId: 'b1' }],
    });
    mockedClient.fetchManifest.mockResolvedValue(initial);
    mockedClient.addEdit.mockResolvedValue(updated);

    const { result } = renderHook(() => useManifest('s1'));
    await waitFor(() => expect(result.current.manifest).toEqual(initial));

    await act(async () => {
      await result.current.addEdit({ type: 'delete', blockId: 'b1' });
    });
    expect(mockedClient.addEdit).toHaveBeenCalledWith('s1', { type: 'delete', blockId: 'b1' });
    expect(result.current.manifest).toEqual(updated);
  });

  it('removeEdit calls API and updates manifest', async () => {
    const initial = createManifest({
      sessionId: 's1',
      edits: [{ type: 'delete', blockId: 'b1' }],
    });
    const updated = createManifest({ sessionId: 's1', edits: [] });
    mockedClient.fetchManifest.mockResolvedValue(initial);
    mockedClient.removeEdit.mockResolvedValue(updated);

    const { result } = renderHook(() => useManifest('s1'));
    await waitFor(() => expect(result.current.manifest).toEqual(initial));

    await act(async () => {
      await result.current.removeEdit(0);
    });
    expect(mockedClient.removeEdit).toHaveBeenCalledWith('s1', 0);
    expect(result.current.manifest).toEqual(updated);
  });

  it('save calls API and updates manifest', async () => {
    const initial = createManifest({ sessionId: 's1' });
    const saved = createManifest({ sessionId: 's1', edits: [{ type: 'delete', blockId: 'b1' }] });
    mockedClient.fetchManifest.mockResolvedValue(initial);
    mockedClient.saveManifest.mockResolvedValue(saved);

    const { result } = renderHook(() => useManifest('s1'));
    await waitFor(() => expect(result.current.manifest).toEqual(initial));

    await act(async () => {
      await result.current.save(saved);
    });
    expect(mockedClient.saveManifest).toHaveBeenCalledWith('s1', saved);
    expect(result.current.manifest).toEqual(saved);
  });

  it('addEdit does nothing when sessionId is null', async () => {
    const { result } = renderHook(() => useManifest(null));
    await act(async () => {
      await result.current.addEdit({ type: 'delete', blockId: 'b1' });
    });
    expect(mockedClient.addEdit).not.toHaveBeenCalled();
  });

  it('removeEdit does nothing when sessionId is null', async () => {
    const { result } = renderHook(() => useManifest(null));
    await act(async () => {
      await result.current.removeEdit(0);
    });
    expect(mockedClient.removeEdit).not.toHaveBeenCalled();
  });

  it('save does nothing when sessionId is null', async () => {
    const { result } = renderHook(() => useManifest(null));
    await act(async () => {
      await result.current.save(createManifest());
    });
    expect(mockedClient.saveManifest).not.toHaveBeenCalled();
  });

  it('resets manifest when sessionId changes to null', async () => {
    const manifest = createManifest({ sessionId: 's1' });
    mockedClient.fetchManifest.mockResolvedValue(manifest);
    const { result, rerender } = renderHook(
      ({ id }) => useManifest(id),
      { initialProps: { id: 's1' as string | null } }
    );
    await waitFor(() => expect(result.current.manifest).toEqual(manifest));
    rerender({ id: null });
    expect(result.current.manifest).toBeNull();
  });

  // Undo/Redo tests
  it('undo removes last edit and populates redo stack', async () => {
    const edit = { type: 'delete' as const, blockId: 'b1' };
    const initial = createManifest({ sessionId: 's1', edits: [edit] });
    const afterUndo = createManifest({ sessionId: 's1', edits: [] });
    mockedClient.fetchManifest.mockResolvedValue(initial);
    mockedClient.removeEdit.mockResolvedValue(afterUndo);

    const { result } = renderHook(() => useManifest('s1'));
    await waitFor(() => expect(result.current.manifest).toEqual(initial));
    expect(result.current.canUndo).toBe(true);

    await act(async () => {
      await result.current.undo();
    });
    expect(mockedClient.removeEdit).toHaveBeenCalledWith('s1', 0);
    expect(result.current.manifest).toEqual(afterUndo);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('redo re-adds the undone edit', async () => {
    const edit = { type: 'delete' as const, blockId: 'b1' };
    const initial = createManifest({ sessionId: 's1', edits: [edit] });
    const afterUndo = createManifest({ sessionId: 's1', edits: [] });
    const afterRedo = createManifest({ sessionId: 's1', edits: [edit] });
    mockedClient.fetchManifest.mockResolvedValue(initial);
    mockedClient.removeEdit.mockResolvedValue(afterUndo);
    mockedClient.addEdit.mockResolvedValue(afterRedo);

    const { result } = renderHook(() => useManifest('s1'));
    await waitFor(() => expect(result.current.manifest).toEqual(initial));

    await act(async () => {
      await result.current.undo();
    });
    expect(result.current.canRedo).toBe(true);

    await act(async () => {
      await result.current.redo();
    });
    expect(mockedClient.addEdit).toHaveBeenCalledWith('s1', edit);
    expect(result.current.manifest).toEqual(afterRedo);
    expect(result.current.canRedo).toBe(false);
  });

  it('new edit clears redo stack', async () => {
    const edit1 = { type: 'delete' as const, blockId: 'b1' };
    const edit2 = { type: 'delete' as const, blockId: 'b2' };
    const initial = createManifest({ sessionId: 's1', edits: [edit1] });
    const afterUndo = createManifest({ sessionId: 's1', edits: [] });
    const afterNewEdit = createManifest({ sessionId: 's1', edits: [edit2] });
    mockedClient.fetchManifest.mockResolvedValue(initial);
    mockedClient.removeEdit.mockResolvedValue(afterUndo);
    mockedClient.addEdit.mockResolvedValue(afterNewEdit);

    const { result } = renderHook(() => useManifest('s1'));
    await waitFor(() => expect(result.current.manifest).toEqual(initial));

    // Undo to populate redo stack
    await act(async () => {
      await result.current.undo();
    });
    expect(result.current.canRedo).toBe(true);

    // New edit should clear redo
    await act(async () => {
      await result.current.addEdit(edit2);
    });
    expect(result.current.canRedo).toBe(false);
  });

  it('undo is no-op on empty manifest', async () => {
    const initial = createManifest({ sessionId: 's1', edits: [] });
    mockedClient.fetchManifest.mockResolvedValue(initial);

    const { result } = renderHook(() => useManifest('s1'));
    await waitFor(() => expect(result.current.manifest).toEqual(initial));
    expect(result.current.canUndo).toBe(false);

    await act(async () => {
      await result.current.undo();
    });
    expect(mockedClient.removeEdit).not.toHaveBeenCalled();
  });

  it('redo is no-op when redo stack is empty', async () => {
    const initial = createManifest({ sessionId: 's1', edits: [] });
    mockedClient.fetchManifest.mockResolvedValue(initial);

    const { result } = renderHook(() => useManifest('s1'));
    await waitFor(() => expect(result.current.manifest).toEqual(initial));
    expect(result.current.canRedo).toBe(false);

    await act(async () => {
      await result.current.redo();
    });
    expect(mockedClient.addEdit).not.toHaveBeenCalled();
  });

  it('session change clears redo stack', async () => {
    const edit = { type: 'delete' as const, blockId: 'b1' };
    const manifest1 = createManifest({ sessionId: 's1', edits: [edit] });
    const afterUndo = createManifest({ sessionId: 's1', edits: [] });
    const manifest2 = createManifest({ sessionId: 's2', edits: [] });

    mockedClient.fetchManifest
      .mockResolvedValueOnce(manifest1)
      .mockResolvedValueOnce(manifest2);
    mockedClient.removeEdit.mockResolvedValue(afterUndo);

    const { result, rerender } = renderHook(
      ({ id }) => useManifest(id),
      { initialProps: { id: 's1' as string | null } }
    );
    await waitFor(() => expect(result.current.manifest).toEqual(manifest1));

    // Undo to populate redo stack
    await act(async () => {
      await result.current.undo();
    });
    expect(result.current.canRedo).toBe(true);

    // Switch session
    rerender({ id: 's2' });
    await waitFor(() => expect(result.current.manifest).toEqual(manifest2));
    expect(result.current.canRedo).toBe(false);
  });
});
