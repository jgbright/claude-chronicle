import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUndoRedoKeys } from './useUndoRedoKeys';

function fireKey(key: string, opts: Partial<KeyboardEventInit> = {}, target?: HTMLElement) {
  const event = new KeyboardEvent('keydown', {
    key,
    ctrlKey: true,
    bubbles: true,
    ...opts,
  });
  if (target) {
    Object.defineProperty(event, 'target', { value: target });
  }
  document.dispatchEvent(event);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useUndoRedoKeys', () => {
  it('calls onUndo on Ctrl+Z', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    renderHook(() => useUndoRedoKeys({ onUndo, onRedo, enabled: true }));
    fireKey('z');
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onRedo).not.toHaveBeenCalled();
  });

  it('calls onRedo on Ctrl+Y', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    renderHook(() => useUndoRedoKeys({ onUndo, onRedo, enabled: true }));
    fireKey('y');
    expect(onRedo).toHaveBeenCalledTimes(1);
    expect(onUndo).not.toHaveBeenCalled();
  });

  it('calls onRedo on Ctrl+Shift+Z', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    renderHook(() => useUndoRedoKeys({ onUndo, onRedo, enabled: true }));
    fireKey('z', { shiftKey: true });
    expect(onRedo).toHaveBeenCalledTimes(1);
    expect(onUndo).not.toHaveBeenCalled();
  });

  it('does nothing when enabled is false', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    renderHook(() => useUndoRedoKeys({ onUndo, onRedo, enabled: false }));
    fireKey('z');
    fireKey('y');
    expect(onUndo).not.toHaveBeenCalled();
    expect(onRedo).not.toHaveBeenCalled();
  });

  it('skips when target is INPUT', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    renderHook(() => useUndoRedoKeys({ onUndo, onRedo, enabled: true }));
    const input = document.createElement('input');
    fireKey('z', {}, input);
    expect(onUndo).not.toHaveBeenCalled();
  });

  it('skips when target is TEXTAREA', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    renderHook(() => useUndoRedoKeys({ onUndo, onRedo, enabled: true }));
    const textarea = document.createElement('textarea');
    fireKey('z', {}, textarea);
    expect(onUndo).not.toHaveBeenCalled();
  });

  it('does nothing when Ctrl is not pressed', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    renderHook(() => useUndoRedoKeys({ onUndo, onRedo, enabled: true }));
    fireKey('z', { ctrlKey: false });
    expect(onUndo).not.toHaveBeenCalled();
  });

  it('cleans up listener on unmount', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    const { unmount } = renderHook(() => useUndoRedoKeys({ onUndo, onRedo, enabled: true }));
    unmount();
    fireKey('z');
    expect(onUndo).not.toHaveBeenCalled();
  });
});
