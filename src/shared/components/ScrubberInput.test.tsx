import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ScrubberInput } from '@/shared/components/ScrubberInput'

describe('ScrubberInput', () => {
  it('renders label and input with value', () => {
    render(
      <ScrubberInput
        label="Width (px)"
        value={1080}
        onChange={vi.fn()}
        ariaLabel="Width in pixels"
      />,
    )

    expect(screen.getByText('Width (px)')).toBeInTheDocument()
    expect(screen.getByLabelText('Width in pixels')).toHaveValue('1080')
  })

  it('propagates input changes on blur', () => {
    const onChange = vi.fn()

    render(
      <ScrubberInput
        label="Width (px)"
        value={1080}
        onChange={onChange}
        ariaLabel="Width in pixels"
      />,
    )

    const input = screen.getByLabelText('Width in pixels')
    fireEvent.change(input, { target: { value: '1920' } })
    fireEvent.blur(input)

    expect(onChange).toHaveBeenCalledWith(1920)
  })

  it('propagates input changes on Enter key', () => {
    const onChange = vi.fn()

    render(
      <ScrubberInput
        label="Width (px)"
        value={1080}
        onChange={onChange}
        ariaLabel="Width in pixels"
      />,
    )

    const input = screen.getByLabelText('Width in pixels')
    fireEvent.change(input, { target: { value: '1920' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onChange).toHaveBeenCalledWith(1920)
  })

  it('changes value when dragging on label', () => {
    const onChange = vi.fn()

    render(
      <ScrubberInput
        label="Width (px)"
        value={1080}
        step={1}
        onChange={onChange}
        ariaLabel="Width in pixels"
      />,
    )

    const label = screen.getByText('Width (px)')

    // Start drag
    fireEvent.mouseDown(label, { clientX: 100 })

    // Move mouse 50px to the right
    fireEvent.mouseMove(document, { clientX: 150 })

    expect(onChange).toHaveBeenCalledWith(1130)

    // Release
    fireEvent.mouseUp(document)
  })

  it('decreases value when dragging left', () => {
    const onChange = vi.fn()

    render(
      <ScrubberInput
        label="Width (px)"
        value={1080}
        step={1}
        onChange={onChange}
        ariaLabel="Width in pixels"
      />,
    )

    const label = screen.getByText('Width (px)')
    fireEvent.mouseDown(label, { clientX: 100 })
    fireEvent.mouseMove(document, { clientX: 50 })

    expect(onChange).toHaveBeenCalledWith(1030)

    fireEvent.mouseUp(document)
  })

  it('respects min value during drag', () => {
    const onChange = vi.fn()

    render(
      <ScrubberInput
        label="Width (px)"
        value={100}
        min={50}
        step={1}
        onChange={onChange}
        ariaLabel="Width in pixels"
      />,
    )

    const label = screen.getByText('Width (px)')
    fireEvent.mouseDown(label, { clientX: 100 })
    fireEvent.mouseMove(document, { clientX: 0 })

    expect(onChange).toHaveBeenCalledWith(50)

    fireEvent.mouseUp(document)
  })

  it('respects max value during drag', () => {
    const onChange = vi.fn()

    render(
      <ScrubberInput
        label="Width (px)"
        value={9900}
        max={10000}
        step={1}
        onChange={onChange}
        ariaLabel="Width in pixels"
      />,
    )

    const label = screen.getByText('Width (px)')
    fireEvent.mouseDown(label, { clientX: 100 })
    fireEvent.mouseMove(document, { clientX: 500 })

    expect(onChange).toHaveBeenCalledWith(10000)

    fireEvent.mouseUp(document)
  })

  it('uses custom step value', () => {
    const onChange = vi.fn()

    render(
      <ScrubberInput
        label="Width (px)"
        value={1000}
        step={10}
        onChange={onChange}
        ariaLabel="Width in pixels"
      />,
    )

    const label = screen.getByText('Width (px)')
    fireEvent.mouseDown(label, { clientX: 100 })
    fireEvent.mouseMove(document, { clientX: 110 })

    expect(onChange).toHaveBeenCalledWith(1100)

    fireEvent.mouseUp(document)
  })

  it('renders a disabled input when disabled', () => {
    const onChange = vi.fn()

    render(
      <ScrubberInput
        label="Width (px)"
        value={1080}
        disabled
        onChange={onChange}
        ariaLabel="Width in pixels"
      />,
    )

    expect(screen.getByText('Width (px)')).toBeInTheDocument()
    expect(screen.getByLabelText('Width in pixels')).toBeDisabled()
  })
})
