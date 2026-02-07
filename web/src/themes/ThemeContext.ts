import { createContext, useContext } from 'react';
import type { ThemeComponentSet } from './ThemeComponents';

const ThemeComponentContext = createContext<ThemeComponentSet | null>(null);

export const ThemeComponentProvider = ThemeComponentContext.Provider;

export function useThemeComponents(): ThemeComponentSet {
  const ctx = useContext(ThemeComponentContext);
  if (!ctx) {
    throw new Error('useThemeComponents must be used within a ThemeComponentProvider');
  }
  return ctx;
}
