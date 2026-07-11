import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from '@/app/App'
import { ThemeProvider } from '@/app/providers/ThemeProvider'

describe('App header', () => {
  it('renders a link to the GitHub repository', () => {
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    )

    const link = screen.getByRole('link', { name: /open photomoat github repository/i })

    expect(link).toHaveAttribute('href', 'https://github.com/LightBreakfast/photomoat')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
