'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

type ThemeMode = 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (nextMode: ThemeMode) => void;
  toggleMode: () => void;
};

const STORAGE_KEY = 'vt.theme.mode';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveSystemMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyMode(mode: ThemeMode) {
  document.documentElement.dataset.theme = mode;
}

export function ThemeProvider({children}: {children: ReactNode}) {
  const [mode, setModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    let nextMode = resolveSystemMode();

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') {
        nextMode = saved;
      }
    } catch {
      // localStorage can be blocked; keep system mode
    }

    setModeState(nextMode);
    applyMode(nextMode);
  }, []);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    applyMode(nextMode);

    try {
      window.localStorage.setItem(STORAGE_KEY, nextMode);
    } catch {
      // noop
    }
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'light' ? 'dark' : 'light');
  }, [mode, setMode]);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      toggleMode
    }),
    [mode, setMode, toggleMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
