import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { PresetSelector } from '@/features/borders/components/PresetSelector'
import { instagramPresets } from '@/features/borders/presets'

describe('PresetSelector', () => {
  it('shows Instagram preset dropdown and allows switching presets', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(
      <PresetSelector
        instagramPresets={instagramPresets}
        selectedPresetId="instagram-square"
        onChange={onChange}
      />,
    )

    await user.click(screen.getByRole('combobox', { name: /instagram size preset/i }))
    await user.click(screen.getByRole('option', { name: /portrait/i }))

    expect(onChange).toHaveBeenCalledWith('instagram-portrait')
  })

  it('shows custom option in the dropdown', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(
      <PresetSelector
        instagramPresets={instagramPresets}
        selectedPresetId="instagram-square"
        onChange={onChange}
        onCustomWidthChange={vi.fn()}
        onCustomHeightChange={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('combobox', { name: /instagram size preset/i }))
    await user.click(screen.getByRole('option', { name: /custom/i }))

    expect(onChange).toHaveBeenCalledWith('custom')
  })

  it('shows custom dimension inputs when custom is selected', () => {
    render(
      <PresetSelector
        instagramPresets={instagramPresets}
        selectedPresetId="custom"
        onChange={vi.fn()}
        customWidth={1080}
        customHeight={1080}
        onCustomWidthChange={vi.fn()}
        onCustomHeightChange={vi.fn()}
      />,
    )

    expect(screen.getByLabelText(/custom width in pixels/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/custom height in pixels/i)).toBeInTheDocument()
  })

  it('hides custom dimension inputs when an Instagram preset is selected', () => {
    render(
      <PresetSelector
        instagramPresets={instagramPresets}
        selectedPresetId="instagram-square"
        onChange={vi.fn()}
        customWidth={1080}
        customHeight={1080}
        onCustomWidthChange={vi.fn()}
        onCustomHeightChange={vi.fn()}
      />,
    )

    expect(screen.queryByLabelText(/custom width in pixels/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/custom height in pixels/i)).not.toBeInTheDocument()
  })

  it('propagates custom width changes', () => {
    const onCustomWidthChange = vi.fn()

    render(
      <PresetSelector
        instagramPresets={instagramPresets}
        selectedPresetId="custom"
        onChange={vi.fn()}
        customWidth={1080}
        customHeight={1080}
        onCustomWidthChange={onCustomWidthChange}
        onCustomHeightChange={vi.fn()}
      />,
    )

    const input = screen.getByLabelText(/custom width in pixels/i)
    fireEvent.change(input, { target: { value: '1920' } })
    fireEvent.blur(input)

    expect(onCustomWidthChange).toHaveBeenCalledWith(1920)
  })

  it('propagates custom height changes', () => {
    const onCustomHeightChange = vi.fn()

    render(
      <PresetSelector
        instagramPresets={instagramPresets}
        selectedPresetId="custom"
        onChange={vi.fn()}
        customWidth={1080}
        customHeight={1080}
        onCustomWidthChange={vi.fn()}
        onCustomHeightChange={onCustomHeightChange}
      />,
    )

    const input = screen.getByLabelText(/custom height in pixels/i)
    fireEvent.change(input, { target: { value: '1920' } })
    fireEvent.blur(input)

    expect(onCustomHeightChange).toHaveBeenCalledWith(1920)
  })

  it('shows selected Instagram preset details in the trigger', () => {
    render(
      <PresetSelector
        instagramPresets={instagramPresets}
        selectedPresetId="instagram-portrait"
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByText('Size')).toBeInTheDocument()
    expect(screen.getByText('Portrait')).toBeInTheDocument()
    expect(screen.getByText('1080×1350 px')).toBeInTheDocument()
  })

  it('shows custom details in the trigger when custom is selected', () => {
    render(
      <PresetSelector
        instagramPresets={instagramPresets}
        selectedPresetId="custom"
        onChange={vi.fn()}
        customWidth={1440}
        customHeight={1440}
        onCustomWidthChange={vi.fn()}
        onCustomHeightChange={vi.fn()}
      />,
    )

    expect(screen.getByText('Size')).toBeInTheDocument()
    expect(screen.getByText('Custom')).toBeInTheDocument()
    expect(screen.getAllByText('1440×1440 px').length).toBeGreaterThan(0)
  })
})
