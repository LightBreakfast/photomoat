import {
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

import {
  getStoredTheme,
  ThemeContext,
  type ThemePreference,
  themeStorageKey,
} from '@/app/providers/theme'

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<ThemePreference>(() => getStoredTheme())

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(themeStorageKey, theme)
  }, [theme])

  useEffect(() => {
    if (window.localStorage.getItem(themeStorageKey)) {
      return undefined
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
