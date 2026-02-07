import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from './useTheme';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

describe('useTheme', () => {
  it('defaults to claude theme', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('claude');
  });

  it('reads initial theme from localStorage', () => {
    localStorage.setItem('chronicle-theme', 'copilot');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('copilot');
  });

  it('falls back to claude when localStorage has no value', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('claude');
  });

  it('sets data-theme attribute on document element', () => {
    renderHook(() => useTheme());
    expect(document.documentElement.getAttribute('data-theme')).toBe('claude');
  });

  it('updates theme when setTheme is called', () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.setTheme('copilot');
    });
    expect(result.current.theme).toBe('copilot');
  });

  it('persists theme change to localStorage', () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.setTheme('copilot');
    });
    expect(localStorage.getItem('chronicle-theme')).toBe('copilot');
  });

  it('updates data-theme attribute on theme change', () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.setTheme('copilot');
    });
    expect(document.documentElement.getAttribute('data-theme')).toBe('copilot');
  });

  it('returns setTheme function', () => {
    const { result } = renderHook(() => useTheme());
    expect(typeof result.current.setTheme).toBe('function');
  });
});
