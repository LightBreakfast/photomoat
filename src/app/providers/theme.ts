import { createContext } from 'react'

export const themeStorageKey = 'photomoat-theme'

export type ThemePreference = 'light' | 'dark'

export type ThemeContextValue = {
  theme: ThemePreference
  setTheme: (theme: ThemePreference) => void
  toggleTheme: () => void
}

export function getSystemTheme(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function getStoredTheme(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  const storedValue = window.localStorage.getItem(themeStorageKey)

  return storedValue === 'light' || storedValue === 'dark'
    ? storedValue
    : getSystemTheme()
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
