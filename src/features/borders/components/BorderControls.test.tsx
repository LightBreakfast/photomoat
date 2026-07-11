import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { BorderControls } from '@/features/borders/components/BorderControls'

describe('BorderControls', () => {
  it('propagates colour changes', () => {
    const onBackgroundColorChange = vi.fn()

    render(
      <BorderControls
        backgroundColor="#ffffff"
        imageSizingMode="contain"
        imageEdgePixels={900}
        borderWidthPixels={90}
        onBackgroundColorChange={onBackgroundColorChange}
        onImageSizingModeChange={vi.fn()}
        onImageEdgePixelsChange={vi.fn()}
        onBorderWidthPixelsChange={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByLabelText(/pick custom background colour/i), {
      target: { value: '#000000' },
    })

    expect(onBackgroundColorChange).toHaveBeenCalledWith('#000000')
  })

  it('propagates image sizing mode changes', async () => {
    const onImageSizingModeChange = vi.fn()
    const user = userEvent.setup()

    render(
      <BorderControls
        backgroundColor="#ffffff"
        imageSizingMode="contain"
        imageEdgePixels={900}
        borderWidthPixels={90}
        onBackgroundColorChange={vi.fn()}
        onImageSizingModeChange={onImageSizingModeChange}
        onImageEdgePixelsChange={vi.fn()}
        onBorderWidthPixelsChange={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('combobox', { name: /image sizing mode/i }))
    await user.click(screen.getByRole('option', { name: /long edge/i }))

    expect(onImageSizingModeChange).toHaveBeenCalledWith('long-edge')
  })

  it('propagates edge pixel changes when long-edge mode is active', () => {
    const onImageEdgePixelsChange = vi.fn()

    render(
      <BorderControls
        backgroundColor="#ffffff"
        imageSizingMode="long-edge"
        imageEdgePixels={900}
        borderWidthPixels={90}
        onBackgroundColorChange={vi.fn()}
        onImageSizingModeChange={vi.fn()}
        onImageEdgePixelsChange={onImageEdgePixelsChange}
        onBorderWidthPixelsChange={vi.fn()}
      />,
    )

    const input = screen.getByLabelText(/target edge size in pixels/i)
    fireEvent.change(input, { target: { value: '840' } })
    fireEvent.blur(input)

    expect(onImageEdgePixelsChange).toHaveBeenCalledWith(840)
  })

  it('propagates border width changes when border-width mode is active', () => {
    const onBorderWidthPixelsChange = vi.fn()

    render(
      <BorderControls
        backgroundColor="#ffffff"
        imageSizingMode="border-width"
        imageEdgePixels={900}
        borderWidthPixels={90}
        onBackgroundColorChange={vi.fn()}
        onImageSizingModeChange={vi.fn()}
        onImageEdgePixelsChange={vi.fn()}
        onBorderWidthPixelsChange={onBorderWidthPixelsChange}
      />,
    )

    const input = screen.getByLabelText(/border width in pixels/i)
    fireEvent.change(input, { target: { value: '72' } })
    fireEvent.blur(input)

    expect(onBorderWidthPixelsChange).toHaveBeenCalledWith(72)
  })

  it('disables edge and border inputs when mode is contain', () => {
    render(
      <BorderControls
        backgroundColor="#ffffff"
        imageSizingMode="contain"
        imageEdgePixels={900}
        borderWidthPixels={90}
        onBackgroundColorChange={vi.fn()}
        onImageSizingModeChange={vi.fn()}
        onImageEdgePixelsChange={vi.fn()}
        onBorderWidthPixelsChange={vi.fn()}
      />,
    )

    expect(screen.getByLabelText(/target edge size in pixels/i)).toBeDisabled()
    expect(screen.getByLabelText(/border width in pixels/i)).toBeDisabled()
  })

  it('disables edge and border inputs when mode is fill', () => {
    render(
      <BorderControls
        backgroundColor="#ffffff"
        imageSizingMode="fill"
        imageEdgePixels={900}
        borderWidthPixels={90}
        onBackgroundColorChange={vi.fn()}
        onImageSizingModeChange={vi.fn()}
        onImageEdgePixelsChange={vi.fn()}
        onBorderWidthPixelsChange={vi.fn()}
      />,
    )

    expect(screen.getByLabelText(/target edge size in pixels/i)).toBeDisabled()
    expect(screen.getByLabelText(/border width in pixels/i)).toBeDisabled()
  })
})
