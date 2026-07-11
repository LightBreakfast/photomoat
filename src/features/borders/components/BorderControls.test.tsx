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
        minVerticalPaddingPixels={90}
        onBackgroundColorChange={onBackgroundColorChange}
        onImageSizingModeChange={vi.fn()}
        onImageEdgePixelsChange={vi.fn()}
        onBorderWidthPixelsChange={vi.fn()}
        onMinVerticalPaddingPixelsChange={vi.fn()}
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
        minVerticalPaddingPixels={90}
        onBackgroundColorChange={vi.fn()}
        onImageSizingModeChange={onImageSizingModeChange}
        onImageEdgePixelsChange={vi.fn()}
        onBorderWidthPixelsChange={vi.fn()}
        onMinVerticalPaddingPixelsChange={vi.fn()}
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
        minVerticalPaddingPixels={90}
        onBackgroundColorChange={vi.fn()}
        onImageSizingModeChange={vi.fn()}
        onImageEdgePixelsChange={onImageEdgePixelsChange}
        onBorderWidthPixelsChange={vi.fn()}
        onMinVerticalPaddingPixelsChange={vi.fn()}
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
        minVerticalPaddingPixels={90}
        onBackgroundColorChange={vi.fn()}
        onImageSizingModeChange={vi.fn()}
        onImageEdgePixelsChange={vi.fn()}
        onBorderWidthPixelsChange={onBorderWidthPixelsChange}
        onMinVerticalPaddingPixelsChange={vi.fn()}
      />,
    )

    const input = screen.getByLabelText(/horizontal padding in pixels/i)
    fireEvent.change(input, { target: { value: '72' } })
    fireEvent.blur(input)

    expect(onBorderWidthPixelsChange).toHaveBeenCalledWith(72)
  })

  it('does not render extra size inputs when mode is contain', () => {
    render(
      <BorderControls
        backgroundColor="#ffffff"
        imageSizingMode="contain"
        imageEdgePixels={900}
        borderWidthPixels={90}
        minVerticalPaddingPixels={90}
        onBackgroundColorChange={vi.fn()}
        onImageSizingModeChange={vi.fn()}
        onImageEdgePixelsChange={vi.fn()}
        onBorderWidthPixelsChange={vi.fn()}
        onMinVerticalPaddingPixelsChange={vi.fn()}
      />,
    )

    expect(screen.queryByLabelText(/target edge size in pixels/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/horizontal padding in pixels/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/image sizing mode/i)).toBeInTheDocument()
  })

  it('does not render extra size inputs when mode is fill', () => {
    render(
      <BorderControls
        backgroundColor="#ffffff"
        imageSizingMode="fill"
        imageEdgePixels={900}
        borderWidthPixels={90}
        minVerticalPaddingPixels={90}
        onBackgroundColorChange={vi.fn()}
        onImageSizingModeChange={vi.fn()}
        onImageEdgePixelsChange={vi.fn()}
        onBorderWidthPixelsChange={vi.fn()}
        onMinVerticalPaddingPixelsChange={vi.fn()}
      />,
    )

    expect(screen.queryByLabelText(/target edge size in pixels/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/horizontal padding in pixels/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/image sizing mode/i)).toBeInTheDocument()
  })

  it('renders sides and vertical min inputs when fixed-sides mode is active', () => {
    const onBorderWidthPixelsChange = vi.fn()
    const onMinVerticalPaddingPixelsChange = vi.fn()

    render(
      <BorderControls
        backgroundColor="#ffffff"
        imageSizingMode="fixed-sides"
        imageEdgePixels={900}
        borderWidthPixels={90}
        minVerticalPaddingPixels={60}
        onBackgroundColorChange={vi.fn()}
        onImageSizingModeChange={vi.fn()}
        onImageEdgePixelsChange={vi.fn()}
        onBorderWidthPixelsChange={onBorderWidthPixelsChange}
        onMinVerticalPaddingPixelsChange={onMinVerticalPaddingPixelsChange}
      />,
    )

    expect(screen.getByLabelText(/horizontal padding in pixels/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/minimum vertical padding in pixels/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/horizontal padding in pixels/i)).toHaveValue('90')
    expect(screen.getByLabelText(/minimum vertical padding in pixels/i)).toHaveValue('60')
  })

  it('propagates vertical padding changes when fixed-sides mode is active', () => {
    const onMinVerticalPaddingPixelsChange = vi.fn()

    render(
      <BorderControls
        backgroundColor="#ffffff"
        imageSizingMode="fixed-sides"
        imageEdgePixels={900}
        borderWidthPixels={90}
        minVerticalPaddingPixels={60}
        onBackgroundColorChange={vi.fn()}
        onImageSizingModeChange={vi.fn()}
        onImageEdgePixelsChange={vi.fn()}
        onBorderWidthPixelsChange={vi.fn()}
        onMinVerticalPaddingPixelsChange={onMinVerticalPaddingPixelsChange}
      />,
    )

    fireEvent.change(screen.getByLabelText(/minimum vertical padding in pixels/i), {
      target: { value: '48' },
    })
    fireEvent.blur(screen.getByLabelText(/minimum vertical padding in pixels/i))

    expect(onMinVerticalPaddingPixelsChange).toHaveBeenCalledWith(48)
  })
})
