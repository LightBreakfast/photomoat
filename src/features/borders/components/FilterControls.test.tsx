import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { FilterControls } from '@/features/borders/components/FilterControls'

type FilterControlsProps = React.ComponentProps<typeof FilterControls>

function renderFilterControls(overrides: Partial<FilterControlsProps> = {}) {
  const defaults: FilterControlsProps = {
    selectedPresetId: 'original',
    onPresetChange: vi.fn(),
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

  it('changes the selected preset via the select', async () => {
    const onPresetChange = vi.fn()
    renderFilterControls({ onPresetChange })

    await userEvent.click(screen.getByRole('combobox', { name: 'Filter preset' }))
    await userEvent.click(screen.getByRole('option', { name: 'Noir' }))

    expect(onPresetChange).toHaveBeenCalledWith('noir')
  })
})
