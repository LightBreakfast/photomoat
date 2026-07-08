import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ExportControls } from '@/shared/components/ExportControls'

describe('ExportControls', () => {
  it('disables batch export when there are no images', () => {
    render(
      <ExportControls
        variant="batch"
        disabled
        outputFormat="image/png"
        jpegQuality={0.92}
        onOutputFormatChange={vi.fn()}
        onJpegQualityChange={vi.fn()}
        onBatchExport={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /export zip/i })).toBeDisabled()
  })

  it('enables batch export when images exist', () => {
    render(
      <ExportControls
        variant="batch"
        outputFormat="image/png"
        jpegQuality={0.92}
        onOutputFormatChange={vi.fn()}
        onJpegQualityChange={vi.fn()}
        onBatchExport={vi.fn()}
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
})
