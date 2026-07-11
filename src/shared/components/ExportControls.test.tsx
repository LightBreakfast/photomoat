import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ExportControls } from '@/shared/components/ExportControls'

describe('ExportControls', () => {
  it('disables zip export when there are no images', () => {
    render(
      <ExportControls
        variant="batch"
        disabled
        exportCount={2}
        outputFormat="image/png"
        jpegQuality={0.92}
        onOutputFormatChange={vi.fn()}
        onJpegQualityChange={vi.fn()}
        onExport={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /export zip/i })).toBeDisabled()
  })

  it('enables zip export when multiple images exist', () => {
    render(
      <ExportControls
        variant="batch"
        exportCount={2}
        outputFormat="image/png"
        jpegQuality={0.92}
        onOutputFormatChange={vi.fn()}
        onJpegQualityChange={vi.fn()}
        onExport={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /export zip/i })).toBeEnabled()
  })

  it('calls the single download handler', async () => {
    const onDownload = vi.fn()
    const user = userEvent.setup()

    render(<ExportControls variant="single" onDownload={onDownload} />)

    await user.click(screen.getByRole('button', { name: /download/i }))

    expect(onDownload).toHaveBeenCalled()
  })

  it('uses an image export action when exactly one item will be exported', () => {
    render(
      <ExportControls
        variant="batch"
        exportCount={1}
        outputFormat="image/png"
        jpegQuality={0.92}
        onOutputFormatChange={vi.fn()}
        onJpegQualityChange={vi.fn()}
        onExport={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /export image/i })).toBeInTheDocument()
  })

  it('hides quality control when output format is PNG', () => {
    render(
      <ExportControls
        variant="batch"
        exportCount={2}
        outputFormat="image/png"
        jpegQuality={0.92}
        onOutputFormatChange={vi.fn()}
        onJpegQualityChange={vi.fn()}
        onExport={vi.fn()}
      />,
    )

    expect(screen.queryByLabelText(/jpeg quality percent/i)).not.toBeInTheDocument()
  })

  it('shows quality control when output format is JPG', () => {
    render(
      <ExportControls
        variant="batch"
        exportCount={1}
        outputFormat="image/jpeg"
        jpegQuality={0.92}
        onOutputFormatChange={vi.fn()}
        onJpegQualityChange={vi.fn()}
        onExport={vi.fn()}
      />,
    )

    expect(screen.getByLabelText(/jpeg quality percent/i)).toBeInTheDocument()
    expect(screen.getByText('Quality')).toBeInTheDocument()
    expect(screen.getByLabelText(/jpeg quality percent/i)).toHaveValue('92')
  })

  it('emits decimal quality when changing the JPG quality control', async () => {
    const onJpegQualityChange = vi.fn()
    const user = userEvent.setup()

    render(
      <ExportControls
        variant="batch"
        exportCount={1}
        outputFormat="image/jpeg"
        jpegQuality={0.92}
        onOutputFormatChange={vi.fn()}
        onJpegQualityChange={onJpegQualityChange}
        onExport={vi.fn()}
      />,
    )

    const input = screen.getByLabelText(/jpeg quality percent/i)
    await user.click(input)
    await user.clear(input)
    await user.type(input, '95')
    await user.tab()

    expect(onJpegQualityChange).toHaveBeenCalledWith(0.95)
  })
})
