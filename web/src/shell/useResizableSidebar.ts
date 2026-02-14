import { useState, useRef, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'chronicle-sidebar-width';
const COLLAPSED_KEY = 'chronicle-sidebar-collapsed';
const MIN_WIDTH = 200;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 300;

function clamp(value: number): number {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, value));
}

function readStoredWidth(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return DEFAULT_WIDTH;
    const parsed = Number(stored);
    if (!Number.isFinite(parsed)) return DEFAULT_WIDTH;
    return clamp(parsed);
  } catch {
    return DEFAULT_WIDTH;
  }
}

function readStoredCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function useResizableSidebar() {
  const [width, setWidth] = useState(readStoredWidth);
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(readStoredCollapsed);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const handlersRef = useRef<{ move: (e: PointerEvent) => void; up: (e: PointerEvent) => void } | null>(null);

  const persistWidth = useCallback((w: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(w));
    } catch {
      // localStorage may be unavailable
    }
  }, []);

  const persistCollapsed = useCallback((collapsed: boolean) => {
    try {
      localStorage.setItem(COLLAPSED_KEY, String(collapsed));
    } catch {
      // localStorage may be unavailable
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      persistCollapsed(next);
      return next;
    });
  }, [persistCollapsed]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      startX.current = e.clientX;
      startWidth.current = width;
      isDraggingRef.current = true;
      hasMovedRef.current = false;
      setIsDragging(true);

      const handleMove = (ev: PointerEvent) => {
        if (!isDraggingRef.current) return;
        hasMovedRef.current = true;
        const delta = ev.clientX - startX.current;
        setWidth(clamp(startWidth.current + delta));
      };

      const handleUp = (ev: PointerEvent) => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        setIsDragging(false);
        const delta = ev.clientX - startX.current;
        const finalWidth = clamp(startWidth.current + delta);
        setWidth(finalWidth);
        persistWidth(finalWidth);
        document.removeEventListener('pointermove', handleMove);
        document.removeEventListener('pointerup', handleUp);
        handlersRef.current = null;
      };

      handlersRef.current = { move: handleMove, up: handleUp };
      document.addEventListener('pointermove', handleMove);
      document.addEventListener('pointerup', handleUp);
    },
    [width, persistWidth],
  );

  const onDoubleClick = useCallback(() => {
    if (isCollapsed) {
      setIsCollapsed(false);
      persistCollapsed(false);
    }
    setWidth(DEFAULT_WIDTH);
    persistWidth(DEFAULT_WIDTH);
  }, [isCollapsed, persistCollapsed, persistWidth]);

  // Cleanup document listeners on unmount
  useEffect(() => {
    return () => {
      if (handlersRef.current) {
        document.removeEventListener('pointermove', handlersRef.current.move);
        document.removeEventListener('pointerup', handlersRef.current.up);
      }
    };
  }, []);

  // Sync from storage events (other tabs)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue !== null) {
        const parsed = Number(e.newValue);
        if (Number.isFinite(parsed)) {
          setWidth(clamp(parsed));
        }
      }
      if (e.key === COLLAPSED_KEY && e.newValue !== null) {
        setIsCollapsed(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return {
    sidebarWidth: isCollapsed ? 0 : width,
    isDragging,
    isCollapsed,
    toggleCollapsed,
    hasMovedRef,
    dividerProps: {
      onPointerDown,
      onDoubleClick,
    },
  };
}
