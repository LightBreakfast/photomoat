import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { WorkspaceModeToggle } from '@/features/borders/components/WorkspaceModeToggle'

describe('WorkspaceModeToggle', () => {
  it('renders Browse and Inspect buttons', () => {
    render(<WorkspaceModeToggle mode="browse" onChange={vi.fn()} />)

    expect(screen.getByRole('radio', { name: 'Browse' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Inspect' })).toBeInTheDocument()
  })

  it('shows Browse as active when mode is browse', () => {
    render(<WorkspaceModeToggle mode="browse" onChange={vi.fn()} />)

    expect(screen.getByRole('radio', { name: 'Browse' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Inspect' })).toHaveAttribute('aria-checked', 'false')
  })

  it('shows Inspect as active when mode is inspect', () => {
    render(<WorkspaceModeToggle mode="inspect" onChange={vi.fn()} />)

    expect(screen.getByRole('radio', { name: 'Browse' })).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('radio', { name: 'Inspect' })).toHaveAttribute('aria-checked', 'true')
  })

  it('calls onChange with inspect when Inspect is clicked', async () => {
    const onChange = vi.fn()
    render(<WorkspaceModeToggle mode="browse" onChange={onChange} />)

    await userEvent.click(screen.getByRole('radio', { name: 'Inspect' }))

    expect(onChange).toHaveBeenCalledWith('inspect')
  })

  it('calls onChange with browse when Browse is clicked', async () => {
    const onChange = vi.fn()
    render(<WorkspaceModeToggle mode="inspect" onChange={onChange} />)

    await userEvent.click(screen.getByRole('radio', { name: 'Browse' }))

    expect(onChange).toHaveBeenCalledWith('browse')
  })

  it('disables both buttons when disabled is true', () => {
    render(<WorkspaceModeToggle mode="browse" onChange={vi.fn()} disabled />)

    expect(screen.getByRole('radio', { name: 'Browse' })).toBeDisabled()
    expect(screen.getByRole('radio', { name: 'Inspect' })).toBeDisabled()
  })
})
