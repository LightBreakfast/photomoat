import { fireEvent, render, screen, within } from '@testing-library/react'
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

  it('opens the export options menu from the caret', async () => {
    renderBatch()

    await openExportOptions()

    const menu = screen.getByRole('menu')
    expect(within(menu).getByText('File naming')).toBeInTheDocument()
    expect(within(menu).getByLabelText('Filename pattern')).toHaveValue('{name}-bordered')
    expect(within(menu).getByLabelText('Folder name')).toHaveValue('photomoat-borders')
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

  it('inserts a token at the cursor position', async () => {
    const onFilenamePatternChange = vi.fn()
    const user = userEvent.setup()

    renderBatch({ filenamePattern: '{name}', onFilenamePatternChange })

    await user.click(screen.getByRole('button', { name: 'Export options' }))
    const input = await screen.findByLabelText('Filename pattern')
    await user.click(input)
    await user.keyboard('{End}')

    await user.click(screen.getByRole('button', { name: 'Insert {datetime}' }))

    expect(onFilenamePatternChange).toHaveBeenLastCalledWith('{name}{datetime}')
  })

  it('shows a filename preview derived from the first export item', async () => {
    renderBatch({
      exportCount: 1,
      previewFilename: 'portrait.jpg',
      filenamePattern: '{name}-{date}',
    })

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Export options' }))

    expect(await screen.findByText(/^Preview: portrait-\d{4}-\d{2}-\d{2}\.png$/)).toBeInTheDocument()
  })

  it('shows the folder preview with the zip extension', async () => {
    renderBatch({ folderName: 'my-trip' })

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Export options' }))

    expect(await screen.findByText('Preview: my-trip.zip')).toBeInTheDocument()
  })

  it('fires the reset action from the menu', async () => {
    const onResetExportSettings = vi.fn()

    renderBatch({ onResetExportSettings })

    const user = await openExportOptions()
    await user.click(await screen.findByRole('menuitem', { name: /reset to defaults/i }))

    expect(onResetExportSettings).toHaveBeenCalled()
  })

  it('calls the export action from the main button', async () => {
    const onExport = vi.fn()
    const user = userEvent.setup()

    renderBatch({ onExport })

    await user.click(screen.getByRole('button', { name: /export zip/i }))

    expect(onExport).toHaveBeenCalled()
  })
})
