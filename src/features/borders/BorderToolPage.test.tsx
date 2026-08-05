import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BorderToolPage } from '@/features/borders/BorderToolPage'
import type { ImageQueueItem } from '@/shared/types'

const {
  useImageQueueMock,
  renderProcessedCanvasMock,
  exportZipMock,
  canvasToBlobMock,
  downloadBlobMock,
} = vi.hoisted(() => ({
  useImageQueueMock: vi.fn(),
  renderProcessedCanvasMock: vi.fn(),
  exportZipMock: vi.fn(),
  canvasToBlobMock: vi.fn(),
  downloadBlobMock: vi.fn(),
}))

vi.mock('@/shared/hooks/useImageQueue', () => ({
  useImageQueue: useImageQueueMock,
}))

vi.mock('@/features/borders/processing/canvasProcessor', () => ({
  renderProcessedCanvas: renderProcessedCanvasMock,
}))

vi.mock('@/shared/utils/exportZip', () => ({
  exportZip: exportZipMock,
}))

vi.mock('@/shared/utils/downloadBlob', () => ({
  canvasToBlob: canvasToBlobMock,
  downloadBlob: downloadBlobMock,
}))

vi.mock('@/features/borders/components/BrowseWorkspace', () => ({
  BrowseWorkspace: ({
    getItemRecipe,
    getItemFilterAdjustments,
    getItemMenuActions,
    onInspect,
    items,
  }: {
    getItemRecipe: (id: string) => { filterPresetId: string }
    getItemFilterAdjustments: (id: string) => { hueRotate?: number }
    getItemMenuActions?: (
      id: string,
    ) => Array<
      | {
          label: string
          items: Array<{ label: string; onClick: () => void }>
        }
      | { type: 'separator' }
    >
    onInspect?: (index: number) => void
    items?: Array<{ id: string }>
  }) => {
    const firstId = items?.[0]?.id ?? 'unknown'
    const recipe = getItemRecipe(firstId)
    const adjustments = getItemFilterAdjustments(firstId)
    const menuActions = getItemMenuActions?.(firstId) ?? []
    return (
      <div>
        <div data-testid="browse-recipe-filter">{recipe.filterPresetId}</div>
        <div data-testid="browse-filter">{adjustments?.hueRotate === -10 ? 'ember' : 'original'}</div>
        <button type="button" onClick={() => onInspect?.(0)}>Inspect image</button>
        {menuActions.map((action, index) => {
          if ('items' in action) {
            return (
              <div key={index} data-testid={`menu-heading-${index}`}>
                {action.label}
                {action.items.map((item, itemIndex) => (
                  <button
                    key={itemIndex}
                    type="button"
                    data-testid={
                      item.label === 'Apply to selected'
                        ? 'apply-to-selected'
                        : `menu-action-${index}-${itemIndex}`
                    }
                    onClick={item.onClick}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )
          }
          return <div key={index} data-testid={`menu-separator-${index}`} />
        })}
      </div>
    )
  },
}))

vi.mock('@/features/borders/components/InspectWorkspace', () => ({
  InspectWorkspace: ({ filterAdjustments }: { filterAdjustments?: { hueRotate?: number } }) => (
    <div data-testid="inspect-filter">{filterAdjustments?.hueRotate === -10 ? 'ember' : 'original'}</div>
  ),
}))

function createItem(id: string, filename: string): ImageQueueItem {
  return {
    id,
    file: new File(['data'], filename, { type: 'image/jpeg' }),
    objectUrl: `blob:${id}`,
    filename,
    mimeType: 'image/jpeg',
    status: 'ready',
  }
}

describe('BorderToolPage workspace', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()

    renderProcessedCanvasMock.mockResolvedValue(document.createElement('canvas'))
    canvasToBlobMock.mockResolvedValue(new Blob(['ok'], { type: 'image/png' }))
    exportZipMock.mockImplementation(
      async ({
        items,
        createEntry,
      }: {
        items: ImageQueueItem[]
        createEntry: (item: ImageQueueItem) => Promise<unknown>
      }) => {
        for (const item of items) {
          await createEntry(item)
        }
      },
    )
  })

  it('defaults to browse mode even with one image and keeps browse controls visible', async () => {
    useImageQueueMock.mockReturnValue({
      items: [createItem('1', 'one.jpg')],
      message: null,
      addFiles: vi.fn(),
      removeItem: vi.fn(),
      setItemStatus: vi.fn(),
    })

    render(<BorderToolPage />)

    const footer = screen.getByLabelText('Workspace footer')
    const footerQueries = within(footer)

    expect(footerQueries.getByRole('radio', { name: 'Browse' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(footerQueries.getByRole('radio', { name: 'Inspect' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
    expect(footerQueries.getByRole('button', { name: 'Original' })).toBeInTheDocument()
    expect(footerQueries.getByRole('button', { name: 'Select all' })).toBeInTheDocument()
    expect(footerQueries.getByRole('button', { name: 'Deselect all' })).toBeDisabled()
    expect(footerQueries.getByRole('slider', { name: 'Grid columns' })).toBeInTheDocument()

    await userEvent.click(footerQueries.getByRole('button', { name: 'Select all' }))

    expect(footerQueries.getByText('one.jpg')).toBeInTheDocument()
    expect(footerQueries.getByRole('button', { name: 'Deselect all' })).toBeEnabled()
  })

  it('moves inspect controls into the footer and keeps inspect view clean', async () => {
    useImageQueueMock.mockReturnValue({
      items: [createItem('1', 'one.jpg'), createItem('2', 'two.jpg')],
      message: null,
      addFiles: vi.fn(),
      removeItem: vi.fn(),
      setItemStatus: vi.fn(),
    })

    render(<BorderToolPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Inspect image' }))

    expect(screen.getByTestId('inspect-filter')).toBeInTheDocument()
    expect(screen.queryByTestId('browse-filter')).not.toBeInTheDocument()

    const footer = screen.getByLabelText('Workspace footer')
    const footerQueries = within(footer)

    expect(footerQueries.getByRole('button', { name: 'Previous image' })).toBeInTheDocument()
    expect(footerQueries.getByRole('button', { name: 'Next image' })).toBeInTheDocument()
    expect(footerQueries.getByRole('button', { name: 'Original' })).toBeInTheDocument()
    expect(footerQueries.getByRole('combobox', { name: 'Inspect zoom level' })).toBeInTheDocument()
    expect(footerQueries.getByRole('radio', { name: 'Browse' })).toBeInTheDocument()
    expect(footerQueries.getByRole('radio', { name: 'Inspect' })).toBeInTheDocument()
    expect(footerQueries.getByText('1 / 2')).toBeInTheDocument()
    expect(footerQueries.getByText(/Editing current image/)).toBeInTheDocument()
    expect(footerQueries.getByText(/one\.jpg/)).toBeInTheDocument()
  })

  it('shows original in inspect while compare is held, but keeps exports on the selected filter', async () => {
    useImageQueueMock.mockReturnValue({
      items: [createItem('1', 'one.jpg')],
      message: null,
      addFiles: vi.fn(),
      removeItem: vi.fn(),
      setItemStatus: vi.fn(),
    })

    render(<BorderToolPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Inspect image' }))
    await userEvent.click(screen.getByRole('combobox', { name: 'Filter preset' }))
    await userEvent.click(screen.getByRole('option', { name: 'Ember' }))

    expect(screen.getByTestId('inspect-filter')).toHaveTextContent('ember')

    const footer = screen.getByLabelText('Workspace footer')
    const compareButton = within(footer).getByRole('button', { name: 'Original' })

    fireEvent.pointerDown(compareButton)

    expect(screen.getByTestId('inspect-filter')).toHaveTextContent('original')

    await userEvent.click(screen.getByRole('button', { name: 'Export image' }))

    await waitFor(() => {
      expect(renderProcessedCanvasMock).toHaveBeenCalled()
    })

    expect(renderProcessedCanvasMock.mock.calls[0][0].filterAdjustments).toEqual({
      brightness: 105,
      contrast: 110,
      saturation: 120,
      grayscale: 0,
      sepia: 15,
      hueRotate: -10,
    })

    fireEvent.pointerUp(compareButton)
    expect(screen.getByTestId('inspect-filter')).toHaveTextContent('ember')
  })

  it('shows browse footer controls only in browse mode', () => {
    useImageQueueMock.mockReturnValue({
      items: [createItem('1', 'one.jpg'), createItem('2', 'two.jpg')],
      message: null,
      addFiles: vi.fn(),
      removeItem: vi.fn(),
      setItemStatus: vi.fn(),
    })

    render(<BorderToolPage />)

    const footer = screen.getByLabelText('Workspace footer')
    const footerQueries = within(footer)

    expect(footerQueries.getByRole('button', { name: 'Original' })).toBeInTheDocument()
    expect(footerQueries.getByRole('button', { name: 'Select all' })).toBeInTheDocument()
    expect(footerQueries.getByRole('slider', { name: 'Grid columns' })).toBeInTheDocument()
    expect(footerQueries.getByRole('radio', { name: 'Browse' })).toBeInTheDocument()
    expect(footerQueries.getByRole('radio', { name: 'Inspect' })).toBeInTheDocument()
    expect(
      footerQueries.queryByRole('combobox', { name: 'Inspect zoom level' }),
    ).not.toBeInTheDocument()
  })

  it('shows original in browse while the original button is held', async () => {
    useImageQueueMock.mockReturnValue({
      items: [createItem('1', 'one.jpg')],
      message: null,
      addFiles: vi.fn(),
      removeItem: vi.fn(),
      setItemStatus: vi.fn(),
    })

    render(<BorderToolPage />)

    const footer = screen.getByLabelText('Workspace footer')

    await userEvent.click(within(footer).getByRole('button', { name: 'Select all' }))
    await userEvent.click(screen.getByRole('combobox', { name: 'Filter preset' }))
    await userEvent.click(screen.getByRole('option', { name: 'Ember' }))

    expect(screen.getByTestId('browse-filter')).toHaveTextContent('ember')

    const originalButton = within(footer).getByRole('button', { name: 'Original' })

    expect(originalButton).toHaveAttribute('aria-pressed', 'false')

    fireEvent.pointerDown(originalButton)
    expect(originalButton).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('browse-filter')).toHaveTextContent('original')

    fireEvent.pointerUp(originalButton)
    expect(originalButton).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('browse-filter')).toHaveTextContent('ember')
  })

  it('disables direct edit controls when multiple images are selected in browse', async () => {
    useImageQueueMock.mockReturnValue({
      items: [createItem('1', 'one.jpg'), createItem('2', 'two.jpg'), createItem('3', 'three.jpg')],
      message: null,
      addFiles: vi.fn(),
      removeItem: vi.fn(),
      setItemStatus: vi.fn(),
    })

    render(<BorderToolPage />)

    const footer = screen.getByLabelText('Workspace footer')

    // Select all
    await userEvent.click(within(footer).getByRole('button', { name: 'Select all' }))

    // Multi-select status text should show
    expect(within(footer).getByText('3 images selected')).toBeInTheDocument()

    // Filter select should be disabled when multi-selected
    expect(screen.getByRole('combobox', { name: 'Filter preset' })).toBeDisabled()
  })

  it('applies one image recipe to other selected images via context menu', async () => {
    useImageQueueMock.mockReturnValue({
      items: [createItem('1', 'one.jpg'), createItem('2', 'two.jpg'), createItem('3', 'three.jpg')],
      message: null,
      addFiles: vi.fn(),
      removeItem: vi.fn(),
      setItemStatus: vi.fn(),
    })

    render(<BorderToolPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Inspect image' }))
    await userEvent.click(screen.getByRole('combobox', { name: 'Filter preset' }))
    await userEvent.click(screen.getByRole('option', { name: 'Ember' }))

    const footer = screen.getByLabelText('Workspace footer')
    await userEvent.click(within(footer).getByRole('radio', { name: 'Browse' }))
    await userEvent.click(within(footer).getByRole('button', { name: 'Select all' }))

    const applyButton = screen.getByTestId('apply-to-selected')
    expect(applyButton).toHaveTextContent('Apply to selected')
    await userEvent.click(applyButton)

    await userEvent.click(screen.getByRole('button', { name: 'Export ZIP' }))

    await waitFor(() => {
      expect(renderProcessedCanvasMock).toHaveBeenCalled()
    })

    const calls = renderProcessedCanvasMock.mock.calls
    expect(calls).toHaveLength(3)
    for (const call of calls) {
      expect(call[0].filterAdjustments).toEqual({
        brightness: 105,
        contrast: 110,
        saturation: 120,
        grayscale: 0,
        sepia: 15,
        hueRotate: -10,
      })
    }
  })

  it('per-image recipes: single selected image in browse is independently editable', async () => {
    useImageQueueMock.mockReturnValue({
      items: [createItem('1', 'one.jpg'), createItem('2', 'two.jpg')],
      message: null,
      addFiles: vi.fn(),
      removeItem: vi.fn(),
      setItemStatus: vi.fn(),
    })

    render(<BorderToolPage />)

    // BrowseWorkspace mock receives getItemRecipe and getItemFilterAdjustments
    // Both images should start with the default recipe (original filter)
    expect(screen.getByTestId('browse-recipe-filter')).toHaveTextContent('original')
  })

  it('per-image recipes: export uses each image own recipe', async () => {
    const items = [createItem('1', 'one.jpg'), createItem('2', 'two.jpg')]

    useImageQueueMock.mockReturnValue({
      items,
      message: null,
      addFiles: vi.fn(),
      removeItem: vi.fn(),
      setItemStatus: vi.fn(),
    })

    render(<BorderToolPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Export ZIP' }))

    await waitFor(() => {
      expect(renderProcessedCanvasMock).toHaveBeenCalled()
    })

    // Both images should be rendered with the default recipe
    expect(renderProcessedCanvasMock.mock.calls[0][0].filterAdjustments).toEqual({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      grayscale: 0,
      sepia: 0,
      hueRotate: 0,
    })
  })

  it('exports a single ready item directly instead of creating a zip', async () => {
    useImageQueueMock.mockReturnValue({
      items: [
        createItem('1', 'one.jpg'),
        {
          ...createItem('2', 'two.jpg'),
          status: 'processing',
        },
      ],
      message: null,
      addFiles: vi.fn(),
      removeItem: vi.fn(),
      setItemStatus: vi.fn(),
    })

    render(<BorderToolPage />)

    expect(screen.getByRole('button', { name: 'Export image' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Export image' }))

    await waitFor(() => {
      expect(renderProcessedCanvasMock).toHaveBeenCalledTimes(1)
    })

    expect(exportZipMock).not.toHaveBeenCalled()
  })

  it('uses the filename pattern for single exports', async () => {
    window.localStorage.setItem(
      'photomoat-export-settings',
      JSON.stringify({ filenamePattern: '{name}-{date}' }),
    )
    useImageQueueMock.mockReturnValue({
      items: [createItem('1', 'one.jpg')],
      message: null,
      addFiles: vi.fn(),
      removeItem: vi.fn(),
      setItemStatus: vi.fn(),
    })

    render(<BorderToolPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Export image' }))

    await waitFor(() => {
      expect(downloadBlobMock).toHaveBeenCalled()
    })

    const [, filename] = downloadBlobMock.mock.calls[0]
    expect(filename).toMatch(/^one-\d{4}-\d{2}-\d{2}\.png$/)
  })

  it('uses the folder name for the zip archive name', async () => {
    window.localStorage.setItem(
      'photomoat-export-settings',
      JSON.stringify({ folderName: 'holiday-2026' }),
    )
    useImageQueueMock.mockReturnValue({
      items: [createItem('1', 'one.jpg'), createItem('2', 'two.jpg')],
      message: null,
      addFiles: vi.fn(),
      removeItem: vi.fn(),
      setItemStatus: vi.fn(),
    })

    render(<BorderToolPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Export ZIP' }))

    await waitFor(() => {
      expect(exportZipMock).toHaveBeenCalled()
    })

    expect(exportZipMock.mock.calls[0][0].zipFilename).toBe('holiday-2026.zip')
  })

  it('applies the filename pattern to zip entries', async () => {
    window.localStorage.setItem(
      'photomoat-export-settings',
      JSON.stringify({ filenamePattern: '{name}-{time}' }),
    )

    const entryFilenames: string[] = []
    exportZipMock.mockImplementation(
      async ({
        items,
        createEntry,
      }: {
        items: ImageQueueItem[]
        createEntry: (item: ImageQueueItem) => Promise<{ filename: string }>
      }) => {
        for (const item of items) {
          const entry = await createEntry(item)
          entryFilenames.push(entry.filename)
        }
      },
    )

    useImageQueueMock.mockReturnValue({
      items: [createItem('1', 'one.jpg'), createItem('2', 'two.jpg')],
      message: null,
      addFiles: vi.fn(),
      removeItem: vi.fn(),
      setItemStatus: vi.fn(),
    })

    render(<BorderToolPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Export ZIP' }))

    await waitFor(() => {
      expect(entryFilenames).toHaveLength(2)
    })

    expect(entryFilenames[0]).toMatch(/^one-\d{6}\.png$/)
    expect(entryFilenames[1]).toMatch(/^two-\d{6}\.png$/)
  })

  it('keeps the historical default filenames when settings are untouched', async () => {
    useImageQueueMock.mockReturnValue({
      items: [createItem('1', 'one.jpg')],
      message: null,
      addFiles: vi.fn(),
      removeItem: vi.fn(),
      setItemStatus: vi.fn(),
    })

    render(<BorderToolPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Export image' }))

    await waitFor(() => {
      expect(downloadBlobMock).toHaveBeenCalled()
    })

    const [, filename] = downloadBlobMock.mock.calls[0]
    expect(filename).toBe('one-bordered.png')
  })

  it('rotates the direct edit target from the inspect footer', async () => {
    useImageQueueMock.mockReturnValue({
      items: [createItem('1', 'one.jpg')],
      message: null,
      addFiles: vi.fn(),
      removeItem: vi.fn(),
      setItemStatus: vi.fn(),
    })

    render(<BorderToolPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Inspect image' }))

    const footer = screen.getByLabelText('Workspace footer')
    const footerQueries = within(footer)

    expect(footerQueries.getByRole('button', { name: 'Rotate right' })).toBeInTheDocument()
    expect(footerQueries.getByRole('button', { name: 'Rotate left' })).toBeInTheDocument()
    expect(footerQueries.getByRole('button', { name: 'Flip horizontal' })).toBeInTheDocument()
    expect(footerQueries.getByRole('button', { name: 'Flip vertical' })).toBeInTheDocument()

    const flipHorizontalButton = footerQueries.getByRole('button', { name: 'Flip horizontal' })
    const flipVerticalButton = footerQueries.getByRole('button', { name: 'Flip vertical' })
    expect(flipHorizontalButton).toHaveAttribute('aria-pressed', 'false')
    expect(flipVerticalButton).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(footerQueries.getByRole('button', { name: 'Rotate right' }))
    await userEvent.click(flipHorizontalButton)

    expect(flipHorizontalButton).toHaveAttribute('aria-pressed', 'true')
    expect(flipVerticalButton).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(screen.getByRole('button', { name: 'Export image' }))

    await waitFor(() => {
      expect(renderProcessedCanvasMock).toHaveBeenCalled()
    })

    expect(renderProcessedCanvasMock.mock.calls[0][0].rotationDegrees).toBe(90)
    expect(renderProcessedCanvasMock.mock.calls[0][0].flipHorizontal).toBe(true)
    expect(renderProcessedCanvasMock.mock.calls[0][0].flipVertical).toBe(false)
  })

  it('rotates a single card from its transform menu', async () => {
    useImageQueueMock.mockReturnValue({
      items: [createItem('1', 'one.jpg'), createItem('2', 'two.jpg')],
      message: null,
      addFiles: vi.fn(),
      removeItem: vi.fn(),
      setItemStatus: vi.fn(),
    })

    render(<BorderToolPage />)

    // First card's context menu: Rotate 90° CW
    await userEvent.click(screen.getByRole('button', { name: 'Rotate 90° CW' }))
    await userEvent.click(screen.getByRole('button', { name: 'Export ZIP' }))

    await waitFor(() => {
      expect(renderProcessedCanvasMock).toHaveBeenCalled()
    })

    const calls = renderProcessedCanvasMock.mock.calls
    expect(calls).toHaveLength(2)
    expect(calls[0][0].rotationDegrees).toBe(90)
    expect(calls[1][0].rotationDegrees).toBe(0)
  })

  it('rotates all selected images in a batch from the context menu', async () => {
    useImageQueueMock.mockReturnValue({
      items: [createItem('1', 'one.jpg'), createItem('2', 'two.jpg')],
      message: null,
      addFiles: vi.fn(),
      removeItem: vi.fn(),
      setItemStatus: vi.fn(),
    })

    render(<BorderToolPage />)

    const footer = screen.getByLabelText('Workspace footer')
    await userEvent.click(within(footer).getByRole('button', { name: 'Select all' }))

    await userEvent.click(screen.getByRole('button', { name: 'Rotate selected 90° CW' }))
    await userEvent.click(screen.getByRole('button', { name: 'Export ZIP' }))

    await waitFor(() => {
      expect(renderProcessedCanvasMock).toHaveBeenCalled()
    })

    const calls = renderProcessedCanvasMock.mock.calls
    expect(calls).toHaveLength(2)
    for (const call of calls) {
      expect(call[0].rotationDegrees).toBe(90)
    }
  })

  it('keeps rotation when applying a recipe to selected images', async () => {
    useImageQueueMock.mockReturnValue({
      items: [createItem('1', 'one.jpg'), createItem('2', 'two.jpg'), createItem('3', 'three.jpg')],
      message: null,
      addFiles: vi.fn(),
      removeItem: vi.fn(),
      setItemStatus: vi.fn(),
    })

    render(<BorderToolPage />)

    // Rotate the first card, then copy its recipe to the selection
    await userEvent.click(screen.getByRole('button', { name: 'Rotate 90° CW' }))

    const footer = screen.getByLabelText('Workspace footer')
    await userEvent.click(within(footer).getByRole('button', { name: 'Select all' }))

    const applyButton = screen.getByTestId('apply-to-selected')
    expect(applyButton).toHaveTextContent('Apply to selected')
    await userEvent.click(applyButton)

    await userEvent.click(screen.getByRole('button', { name: 'Export ZIP' }))

    await waitFor(() => {
      expect(renderProcessedCanvasMock).toHaveBeenCalled()
    })

    const calls = renderProcessedCanvasMock.mock.calls
    expect(calls).toHaveLength(3)
    for (const call of calls) {
      expect(call[0].rotationDegrees).toBe(90)
    }
  })

  it('rotates right with the ] shortcut while inspecting', async () => {
    useImageQueueMock.mockReturnValue({
      items: [createItem('1', 'one.jpg')],
      message: null,
      addFiles: vi.fn(),
      removeItem: vi.fn(),
      setItemStatus: vi.fn(),
    })

    render(<BorderToolPage />)
    await userEvent.click(screen.getByRole('button', { name: 'Inspect image' }))

    fireEvent.keyDown(window, { key: ']', ctrlKey: true })

    await userEvent.click(screen.getByRole('button', { name: 'Export image' }))

    await waitFor(() => {
      expect(renderProcessedCanvasMock).toHaveBeenCalled()
    })

    expect(renderProcessedCanvasMock.mock.calls[0][0].rotationDegrees).toBe(90)
  })

  it('rotates left with the [ shortcut while inspecting', async () => {
    useImageQueueMock.mockReturnValue({
      items: [createItem('1', 'one.jpg')],
      message: null,
      addFiles: vi.fn(),
      removeItem: vi.fn(),
      setItemStatus: vi.fn(),
    })

    render(<BorderToolPage />)
    await userEvent.click(screen.getByRole('button', { name: 'Inspect image' }))

    fireEvent.keyDown(window, { key: '[', ctrlKey: true })

    await userEvent.click(screen.getByRole('button', { name: 'Export image' }))

    await waitFor(() => {
      expect(renderProcessedCanvasMock).toHaveBeenCalled()
    })

    expect(renderProcessedCanvasMock.mock.calls[0][0].rotationDegrees).toBe(270)
  })

  it('ignores rotate shortcuts while a form control is focused', async () => {
    useImageQueueMock.mockReturnValue({
      items: [createItem('1', 'one.jpg')],
      message: null,
      addFiles: vi.fn(),
      removeItem: vi.fn(),
      setItemStatus: vi.fn(),
    })

    render(<BorderToolPage />)
    await userEvent.click(screen.getByRole('button', { name: 'Inspect image' }))

    const zoomSelect = screen.getByLabelText('Inspect zoom level')
    fireEvent.keyDown(zoomSelect, { key: ']' })

    await userEvent.click(screen.getByRole('button', { name: 'Export image' }))

    await waitFor(() => {
      expect(renderProcessedCanvasMock).toHaveBeenCalled()
    })

    expect(renderProcessedCanvasMock.mock.calls[0][0].rotationDegrees).toBe(0)
  })

  it('ignores rotate shortcuts in browse mode', async () => {
    useImageQueueMock.mockReturnValue({
      items: [createItem('1', 'one.jpg')],
      message: null,
      addFiles: vi.fn(),
      removeItem: vi.fn(),
      setItemStatus: vi.fn(),
    })

    render(<BorderToolPage />)

    fireEvent.keyDown(window, { key: ']', ctrlKey: true })

    await userEvent.click(screen.getByRole('button', { name: 'Export image' }))

    await waitFor(() => {
      expect(renderProcessedCanvasMock).toHaveBeenCalled()
    })

    expect(renderProcessedCanvasMock.mock.calls[0][0].rotationDegrees).toBe(0)
  })
})
