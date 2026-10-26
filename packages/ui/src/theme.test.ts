import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  applyThemePreference,
  readThemePreference,
  saveThemePreference,
  THEME_STORAGE_KEY,
  useThemePreference,
} from './theme';

afterEach(() => {
  cleanup();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

const throwingStorage = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
};

describe('readThemePreference', () => {
  it('returns a saved preference', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    expect(readThemePreference(localStorage)).toBe('light');
  });

  it('falls back to "system" for missing, invalid or unreadable storage', () => {
    expect(readThemePreference(localStorage)).toBe('system');
    localStorage.setItem(THEME_STORAGE_KEY, 'purple');
    expect(readThemePreference(localStorage)).toBe('system');
    expect(readThemePreference(throwingStorage)).toBe('system');
    expect(readThemePreference(undefined)).toBe('system');
  });
});

describe('saveThemePreference', () => {
  it('ignores storage that throws', () => {
    expect(() => {
      saveThemePreference(throwingStorage, 'dark');
    }).not.toThrow();
  });
});

describe('applyThemePreference', () => {
  it('sets data-theme for an explicit choice and removes it for "system"', () => {
    const root = document.documentElement;
    applyThemePreference(root, 'light');
    expect(root.dataset.theme).toBe('light');
    applyThemePreference(root, 'system');
    expect(root.dataset.theme).toBeUndefined();
  });
});

describe('useThemePreference', () => {
  it('applies and remembers a new preference', () => {
    const { result } = renderHook(() => useThemePreference());
    expect(result.current[0]).toBe('system');

    act(() => {
      result.current[1]('dark');
    });

    expect(result.current[0]).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });
});
