import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SidebarSection } from '@/features/borders/components/SidebarSection'

describe('SidebarSection', () => {
  it('renders the title', () => {
    render(
      <SidebarSection title="Dimensions">
        <div>Content</div>
      </SidebarSection>,
    )

    expect(screen.getByText('Dimensions')).toBeInTheDocument()
  })

  it('shows content by default', () => {
    render(
      <SidebarSection title="Border">
        <p>Border content</p>
      </SidebarSection>,
    )

    expect(screen.getByText('Border content')).toBeInTheDocument()
  })

  it('toggles content visibility when clicking the button', () => {
    render(
      <SidebarSection title="Export">
        <p>Export content</p>
      </SidebarSection>,
    )

    const button = screen.getByRole('button', { name: 'Export' })

    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Export content')).toBeInTheDocument()

    fireEvent.click(button)

    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Export content')).not.toBeInTheDocument()

    fireEvent.click(button)

    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Export content')).toBeInTheDocument()
  })
})
