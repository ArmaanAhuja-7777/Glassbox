import { useCallback, useEffect, useState } from 'react';

export type ThemePreference = 'dark' | 'light' | 'system';

export const THEME_STORAGE_KEY = 'flowcanvas-theme';

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'dark' || value === 'light' || value === 'system';
}

/** Reads the saved preference. Storage can be missing or throw (private mode, blocked site data), so fall back to "system". */
export function readThemePreference(
  storage: Pick<Storage, 'getItem'> | undefined,
): ThemePreference {
  try {
    const stored = storage?.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

export function saveThemePreference(
  storage: Pick<Storage, 'setItem'> | undefined,
  preference: ThemePreference,
): void {
  try {
    storage?.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Not being able to remember the choice is fine; the theme still applies for this page.
  }
}

/**
 * Applies a preference to the document. "dark"/"light" set data-theme; "system" removes it, so the
 * CSS follows prefers-color-scheme (see the generated tokens.css).
 */
export function applyThemePreference(root: HTMLElement, preference: ThemePreference): void {
  if (preference === 'system') {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = preference;
  }
}

function browserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

/** React hook: the current preference and a setter that applies and remembers it. */
export function useThemePreference(): [ThemePreference, (preference: ThemePreference) => void] {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    readThemePreference(browserStorage()),
  );

  useEffect(() => {
    applyThemePreference(document.documentElement, preference);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    saveThemePreference(browserStorage(), next);
    setPreferenceState(next);
  }, []);

  return [preference, setPreference];
}
