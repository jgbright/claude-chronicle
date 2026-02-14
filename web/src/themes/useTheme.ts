import { useState, useEffect } from 'react';

export type Theme = 'claude' | 'copilot';

const validThemes: Theme[] = ['claude', 'copilot'];

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('chronicle-theme');
    return stored && validThemes.includes(stored as Theme) ? (stored as Theme) : 'claude';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('chronicle-theme', theme);
  }, [theme]);

  return { theme, setTheme };
}
