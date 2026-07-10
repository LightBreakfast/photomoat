import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { FilterControls } from '@/features/borders/components/FilterControls'

type FilterControlsProps = React.ComponentProps<typeof FilterControls>

function renderFilterControls(overrides: Partial<FilterControlsProps> = {}) {
  const defaults: FilterControlsProps = {
    selectedPresetId: 'original',
    isCompareActive: false,
    onPresetChange: vi.fn(),
    onCompareStart: vi.fn(),
    onCompareEnd: vi.fn(),
  }

  return render(<FilterControls {...defaults} {...overrides} />)
}

describe('FilterControls', () => {
  it('renders a Filters section heading', () => {
    renderFilterControls()
    expect(screen.getByText('Filters')).toBeInTheDocument()
  })

  it('renders a select with the selected preset label', () => {
    renderFilterControls({ selectedPresetId: 'ember' })
    expect(screen.getByText('Ember')).toBeInTheDocument()
  })

  it('renders a Hold to compare button', () => {
    renderFilterControls()
    expect(screen.getByRole('button', { name: 'Hold to compare' })).toBeInTheDocument()
  })

  it('shows active compare state', () => {
    renderFilterControls({ isCompareActive: true })
    expect(screen.getByRole('button', { name: 'Hold to compare' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('calls onCompareStart on pointer down', async () => {
    const onCompareStart = vi.fn()
    renderFilterControls({ onCompareStart })

    await userEvent.pointer({
      keys: '[MouseLeft>]',
      target: screen.getByRole('button', { name: 'Hold to compare' }),
    })

    expect(onCompareStart).toHaveBeenCalled()
  })

  it('calls onCompareEnd on pointer up', async () => {
    const onCompareEnd = vi.fn()
    renderFilterControls({ onCompareEnd })

    await userEvent.pointer({
      keys: '[MouseLeft>][/MouseLeft]',
      target: screen.getByRole('button', { name: 'Hold to compare' }),
    })

    expect(onCompareEnd).toHaveBeenCalled()
  })

  it('changes the selected preset via the select', async () => {
    const onPresetChange = vi.fn()
    renderFilterControls({ onPresetChange })

    await userEvent.click(screen.getByRole('combobox', { name: 'Filter preset' }))
    await userEvent.click(screen.getByRole('option', { name: 'Noir' }))

    expect(onPresetChange).toHaveBeenCalledWith('noir')
  })
})
