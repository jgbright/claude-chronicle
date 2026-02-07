import { useState, useEffect } from 'react';

export type Theme = 'claude' | 'copilot';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('chronicle-theme') as Theme) || 'claude';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('chronicle-theme', theme);
  }, [theme]);

  return { theme, setTheme };
}
