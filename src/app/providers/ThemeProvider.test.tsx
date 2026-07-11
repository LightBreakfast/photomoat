import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ThemeProvider } from '@/app/providers/ThemeProvider'
import { getStoredTheme, themeStorageKey } from '@/app/providers/theme'
import { useTheme } from '@/shared/hooks/useTheme'

function mockMatchMedia(matches: boolean) {
  const addEventListener = vi.fn()
  const removeEventListener = vi.fn()

  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn().mockImplementation(() => ({
      matches,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addEventListener,
      removeEventListener,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
    configurable: true,
  })

  return { addEventListener, removeEventListener }
}

function ThemeConsumer() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button type="button" onClick={toggleTheme}>
        toggle
      </button>
    </div>
  )
}

describe('ThemeProvider', () => {
  it('renders children', () => {
    mockMatchMedia(true)

    render(
      <ThemeProvider>
        <div>Hello</div>
      </ThemeProvider>,
    )

    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('persists theme changes to localStorage', async () => {
    mockMatchMedia(true)
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark')
    await user.click(screen.getByRole('button', { name: /toggle/i }))

    expect(window.localStorage.getItem(themeStorageKey)).toBe('light')
    expect(screen.getByTestId('theme-value')).toHaveTextContent('light')
  })

  it('uses system preference when no stored theme exists', () => {
    mockMatchMedia(false)
    window.localStorage.removeItem(themeStorageKey)

    expect(getStoredTheme()).toBe('light')
  })
})
