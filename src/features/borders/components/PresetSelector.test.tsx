import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { PresetSelector } from '@/features/borders/components/PresetSelector'
import { instagramPresets } from '@/features/borders/presets'

describe('PresetSelector', () => {
  it('changes the selected preset', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(
      <PresetSelector
        presets={instagramPresets}
        selectedPresetId="instagram-square"
        onChange={onChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: /portrait post/i }))

    expect(onChange).toHaveBeenCalledWith('instagram-portrait')
  })
})
