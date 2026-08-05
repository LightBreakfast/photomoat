import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ExportControls, type BatchExportControlsProps } from '@/shared/components/ExportControls'

function renderBatch(props: Partial<BatchExportControlsProps> = {}) {
  const baseProps = {
    variant: 'batch' as const,
    exportCount: 2,
    outputFormat: 'image/png' as const,
    jpegQuality: 0.92,
    filenamePattern: '{name}-bordered',
    folderName: 'photomoat-borders',
    onOutputFormatChange: vi.fn(),
    onJpegQualityChange: vi.fn(),
    onFilenamePatternChange: vi.fn(),
    onFolderNameChange: vi.fn(),
    onResetExportSettings: vi.fn(),
    onExport: vi.fn(),
  }

  return render(<ExportControls {...baseProps} {...props} />)
}

async function openExportOptions() {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Export options' }))
  return user
}

describe('ExportControls', () => {
  it('disables zip export when there are no images', () => {
    renderBatch({ disabled: true })

    expect(screen.getByRole('button', { name: /export zip/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Export options' })).toBeDisabled()
  })

  it('enables zip export when multiple images exist', () => {
    renderBatch()

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
    renderBatch({ exportCount: 1 })

    expect(screen.getByRole('button', { name: /export image/i })).toBeInTheDocument()
  })

  it('hides quality control when output format is PNG', () => {
    renderBatch()

    expect(screen.queryByLabelText(/jpeg quality percent/i)).not.toBeInTheDocument()
  })

  it('shows quality control when output format is JPG', () => {
    renderBatch({ exportCount: 1, outputFormat: 'image/jpeg' })

    expect(screen.getByLabelText(/jpeg quality percent/i)).toBeInTheDocument()
    expect(screen.getByText('Quality')).toBeInTheDocument()
    expect(screen.getByLabelText(/jpeg quality percent/i)).toHaveValue('92')
  })

  it('emits decimal quality when changing the JPG quality control', async () => {
    const onJpegQualityChange = vi.fn()
    const user = userEvent.setup()

    renderBatch({
      exportCount: 1,
      outputFormat: 'image/jpeg',
      onJpegQualityChange,
    })

    const input = screen.getByLabelText(/jpeg quality percent/i)
    await user.click(input)
    await user.clear(input)
    await user.type(input, '95')
    await user.tab()

    expect(onJpegQualityChange).toHaveBeenCalledWith(0.95)
  })

  it('opens the export settings dialog from the caret', async () => {
    renderBatch()

    expect(screen.getByRole('button', { name: 'Export options' })).toHaveAttribute(
      'aria-haspopup',
      'dialog',
    )

    await openExportOptions()

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Export settings')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Filename pattern')).toHaveValue('{name}-bordered')
    expect(within(dialog).getByLabelText('ZIP file name')).toHaveValue('photomoat-borders')
    expect(within(dialog).queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
  })

  it('emits pattern changes from the filename input', async () => {
    const onFilenamePatternChange = vi.fn()
    const user = userEvent.setup()

    renderBatch({ onFilenamePatternChange })

    await user.click(screen.getByRole('button', { name: 'Export options' }))
    const input = await screen.findByLabelText('Filename pattern')
    fireEvent.change(input, { target: { value: 'my-pattern' } })

    expect(onFilenamePatternChange).toHaveBeenLastCalledWith('my-pattern')
  })

  it('inserts a token at the cursor position in the pattern', async () => {
    const onFilenamePatternChange = vi.fn()
    const user = userEvent.setup()

    renderBatch({ filenamePattern: '{name}', onFilenamePatternChange })

    await user.click(screen.getByRole('button', { name: 'Export options' }))
    const input = await screen.findByLabelText('Filename pattern')
    await user.click(input)
    await user.keyboard('{End}')

    await user.click(screen.getByRole('button', { name: 'Insert {datetime} into pattern' }))

    expect(onFilenamePatternChange).toHaveBeenLastCalledWith('{name}{datetime}')
  })

  it('inserts a token into the folder name', async () => {
    const onFolderNameChange = vi.fn()
    const user = userEvent.setup()

    renderBatch({ onFolderNameChange })

    await user.click(screen.getByRole('button', { name: 'Export options' }))
    const input = await screen.findByLabelText('ZIP file name')
    await user.click(input)
    await user.keyboard('{End}')

    await user.click(screen.getByRole('button', { name: 'Insert {date} into folder name' }))

    expect(onFolderNameChange).toHaveBeenLastCalledWith('photomoat-borders{date}')
  })

  it('shows a filename preview derived from the first export item', async () => {
    renderBatch({
      exportCount: 1,
      previewFilename: 'portrait.jpg',
      filenamePattern: '{name}-{date}',
    })

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Export options' }))

    expect(await screen.findByText(/^portrait-\d{4}-\d{2}-\d{2}\.png$/)).toBeInTheDocument()
  })

  it('shows the folder preview with the zip extension', async () => {
    renderBatch({ folderName: 'my-trip' })

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Export options' }))

    expect(await screen.findByText('my-trip.zip')).toBeInTheDocument()
  })

  it('applies tokens to the folder preview', async () => {
    renderBatch({ folderName: 'my-trip-{date}' })

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Export options' }))

    expect(
      await screen.findByText(/^my-trip-\d{4}-\d{2}-\d{2}\.zip$/),
    ).toBeInTheDocument()
  })

  it('fires the reset action from the dialog', async () => {
    const onResetExportSettings = vi.fn()

    renderBatch({ onResetExportSettings })

    const user = await openExportOptions()
    await user.click(await screen.findByRole('button', { name: /reset to defaults/i }))

    expect(onResetExportSettings).toHaveBeenCalled()
  })

  it('closes the dialog with the Done button', async () => {
    renderBatch()

    const user = await openExportOptions()
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Done' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('calls the export action from the main button', async () => {
    const onExport = vi.fn()
    const user = userEvent.setup()

    renderBatch({ onExport })

    await user.click(screen.getByRole('button', { name: /export zip/i }))

    expect(onExport).toHaveBeenCalled()
  })
})
