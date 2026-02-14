import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useResizableSidebar } from './useResizableSidebar';

function firePointerEvent(type: string, props: Partial<PointerEvent> = {}) {
  const event = new PointerEvent(type, {
    bubbles: true,
    clientX: (props as { clientX?: number }).clientX ?? 0,
    button: (props as { button?: number }).button ?? 0,
  });
  document.dispatchEvent(event);
}

describe('useResizableSidebar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default width of 300', () => {
    const { result } = renderHook(() => useResizableSidebar());
    expect(result.current.sidebarWidth).toBe(300);
    expect(result.current.isDragging).toBe(false);
  });

  it('reads width from localStorage', () => {
    localStorage.setItem('chronicle-sidebar-width', '400');
    const { result } = renderHook(() => useResizableSidebar());
    expect(result.current.sidebarWidth).toBe(400);
  });

  it('clamps stored width to min', () => {
    localStorage.setItem('chronicle-sidebar-width', '50');
    const { result } = renderHook(() => useResizableSidebar());
    expect(result.current.sidebarWidth).toBe(200);
  });

  it('clamps stored width to max', () => {
    localStorage.setItem('chronicle-sidebar-width', '1000');
    const { result } = renderHook(() => useResizableSidebar());
    expect(result.current.sidebarWidth).toBe(600);
  });

  it('falls back to default for invalid localStorage value', () => {
    localStorage.setItem('chronicle-sidebar-width', 'garbage');
    const { result } = renderHook(() => useResizableSidebar());
    expect(result.current.sidebarWidth).toBe(300);
  });

  it('resets to default on double-click', () => {
    localStorage.setItem('chronicle-sidebar-width', '450');
    const { result } = renderHook(() => useResizableSidebar());
    expect(result.current.sidebarWidth).toBe(450);

    act(() => {
      result.current.dividerProps.onDoubleClick();
    });

    expect(result.current.sidebarWidth).toBe(300);
    expect(localStorage.getItem('chronicle-sidebar-width')).toBe('300');
  });

  it('provides expected divider event handlers', () => {
    const { result } = renderHook(() => useResizableSidebar());
    const { dividerProps } = result.current;
    expect(typeof dividerProps.onPointerDown).toBe('function');
    expect(typeof dividerProps.onDoubleClick).toBe('function');
  });

  it('returns isCollapsed false by default', () => {
    const { result } = renderHook(() => useResizableSidebar());
    expect(result.current.isCollapsed).toBe(false);
  });

  it('reads collapsed state from localStorage', () => {
    localStorage.setItem('chronicle-sidebar-collapsed', 'true');
    const { result } = renderHook(() => useResizableSidebar());
    expect(result.current.isCollapsed).toBe(true);
    expect(result.current.sidebarWidth).toBe(0);
  });

  it('toggleCollapsed flips state and persists', () => {
    const { result } = renderHook(() => useResizableSidebar());
    expect(result.current.isCollapsed).toBe(false);

    act(() => {
      result.current.toggleCollapsed();
    });

    expect(result.current.isCollapsed).toBe(true);
    expect(result.current.sidebarWidth).toBe(0);
    expect(localStorage.getItem('chronicle-sidebar-collapsed')).toBe('true');

    act(() => {
      result.current.toggleCollapsed();
    });

    expect(result.current.isCollapsed).toBe(false);
    expect(localStorage.getItem('chronicle-sidebar-collapsed')).toBe('false');
  });

  it('preserves stored width after collapse/uncollapse round-trip', () => {
    localStorage.setItem('chronicle-sidebar-width', '450');
    const { result } = renderHook(() => useResizableSidebar());
    expect(result.current.sidebarWidth).toBe(450);

    act(() => {
      result.current.toggleCollapsed();
    });
    expect(result.current.sidebarWidth).toBe(0);

    act(() => {
      result.current.toggleCollapsed();
    });
    expect(result.current.sidebarWidth).toBe(450);
  });

  it('double-click uncollapses when collapsed', () => {
    localStorage.setItem('chronicle-sidebar-collapsed', 'true');
    localStorage.setItem('chronicle-sidebar-width', '450');
    const { result } = renderHook(() => useResizableSidebar());
    expect(result.current.isCollapsed).toBe(true);
    expect(result.current.sidebarWidth).toBe(0);

    act(() => {
      result.current.dividerProps.onDoubleClick();
    });

    expect(result.current.isCollapsed).toBe(false);
    expect(result.current.sidebarWidth).toBe(300); // reset to default
    expect(localStorage.getItem('chronicle-sidebar-collapsed')).toBe('false');
  });

  it('simulates drag to resize via document events', () => {
    const { result } = renderHook(() => useResizableSidebar());

    // pointer down at x=300
    act(() => {
      result.current.dividerProps.onPointerDown({
        clientX: 300,
        button: 0,
        preventDefault: () => {},
      } as unknown as React.PointerEvent<HTMLDivElement>);
    });
    expect(result.current.isDragging).toBe(true);

    // pointer move to x=400 (delta +100) via document
    act(() => {
      firePointerEvent('pointermove', { clientX: 400 } as Partial<PointerEvent>);
    });
    expect(result.current.sidebarWidth).toBe(400);

    // pointer up via document
    act(() => {
      firePointerEvent('pointerup', { clientX: 400 } as Partial<PointerEvent>);
    });
    expect(result.current.isDragging).toBe(false);
    expect(localStorage.getItem('chronicle-sidebar-width')).toBe('400');
  });

  it('clamps during drag to min/max', () => {
    const { result } = renderHook(() => useResizableSidebar());

    // Start dragging
    act(() => {
      result.current.dividerProps.onPointerDown({
        clientX: 300,
        button: 0,
        preventDefault: () => {},
      } as unknown as React.PointerEvent<HTMLDivElement>);
    });

    // Drag way to the left (would make width negative)
    act(() => {
      firePointerEvent('pointermove', { clientX: -200 } as Partial<PointerEvent>);
    });
    expect(result.current.sidebarWidth).toBe(200);

    // Drag way to the right
    act(() => {
      firePointerEvent('pointermove', { clientX: 900 } as Partial<PointerEvent>);
    });
    expect(result.current.sidebarWidth).toBe(600);
  });

  it('sets hasMovedRef to true after drag', () => {
    const { result } = renderHook(() => useResizableSidebar());
    expect(result.current.hasMovedRef.current).toBe(false);

    act(() => {
      result.current.dividerProps.onPointerDown({
        clientX: 300,
        button: 0,
        preventDefault: () => {},
      } as unknown as React.PointerEvent<HTMLDivElement>);
    });

    act(() => {
      firePointerEvent('pointermove', { clientX: 350 } as Partial<PointerEvent>);
    });
    expect(result.current.hasMovedRef.current).toBe(true);

    act(() => {
      firePointerEvent('pointerup', { clientX: 350 } as Partial<PointerEvent>);
    });
    expect(result.current.hasMovedRef.current).toBe(true);
  });

  it('hasMovedRef stays false for click without move', () => {
    const { result } = renderHook(() => useResizableSidebar());

    act(() => {
      result.current.dividerProps.onPointerDown({
        clientX: 300,
        button: 0,
        preventDefault: () => {},
      } as unknown as React.PointerEvent<HTMLDivElement>);
    });

    act(() => {
      firePointerEvent('pointerup', { clientX: 300 } as Partial<PointerEvent>);
    });
    expect(result.current.hasMovedRef.current).toBe(false);
  });

  it('ignores right-click on pointer down', () => {
    const { result } = renderHook(() => useResizableSidebar());

    act(() => {
      result.current.dividerProps.onPointerDown({
        clientX: 300,
        button: 2,
        preventDefault: () => {},
      } as unknown as React.PointerEvent<HTMLDivElement>);
    });
    expect(result.current.isDragging).toBe(false);
  });
});
