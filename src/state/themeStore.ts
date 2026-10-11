import { useState, useEffect } from 'react';

export type Theme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'drthreed_theme';

class ThemeStore {
  private theme: Theme = 'dark';
  private listeners = new Set<(theme: Theme) => void>();

  constructor() {
    // Read persisted theme or default to dark
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (saved === 'light' || saved === 'dark') {
        this.theme = saved;
      } else {
        this.theme = 'dark';
      }
      this.applyTheme(this.theme);
    }
  }

  public getTheme(): Theme {
    return this.theme;
  }

  public setTheme(theme: Theme): void {
    this.theme = theme;
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      this.applyTheme(theme);
    }
    this.notify();
  }

  public toggleTheme(): void {
    this.setTheme(this.theme === 'dark' ? 'light' : 'dark');
  }

  public subscribe(listener: (theme: Theme) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.theme);
    }
  }

  private applyTheme(theme: Theme): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.style.colorScheme = theme;
    }
  }
}

export const themeStore = new ThemeStore();

export function useTheme(): { theme: Theme; toggleTheme: () => void; setTheme: (t: Theme) => void } {
  const [theme, setLocalTheme] = useState<Theme>(themeStore.getTheme());

  useEffect(() => {
    return themeStore.subscribe((nextTheme) => {
      setLocalTheme(nextTheme);
    });
  }, []);

  return {
    theme,
    toggleTheme: () => themeStore.toggleTheme(),
    setTheme: (t: Theme) => themeStore.setTheme(t),
  };
}
