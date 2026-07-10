import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BorderToolPage } from '@/features/borders/BorderToolPage'
import { borderSettingsStorageKey } from '@/features/borders/useBorderSettings'
import type { ImageQueueItem } from '@/shared/types'

const {
  useImageQueueMock,
  renderProcessedCanvasMock,
  exportZipMock,
  canvasToBlobMock,
} = vi.hoisted(() => ({
  useImageQueueMock: vi.fn(),
  renderProcessedCanvasMock: vi.fn(),
  exportZipMock: vi.fn(),
  canvasToBlobMock: vi.fn(),
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
  downloadBlob: vi.fn(),
}))

vi.mock('@/features/borders/components/BrowseWorkspace', () => ({
  BrowseWorkspace: ({ filterAdjustments, onInspect }: { filterAdjustments?: { hueRotate?: number }; onInspect?: (index: number) => void }) => (
    <div>
      <div data-testid="browse-filter">{filterAdjustments?.hueRotate === -10 ? 'ember' : 'original'}</div>
      <button type="button" onClick={() => onInspect?.(0)}>Inspect image</button>
    </div>
  ),
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
        await createEntry(items[0])
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

    expect(footerQueries.getByText('1 of 1 selected')).toBeInTheDocument()
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
    expect(footerQueries.getByText('one.jpg')).toBeInTheDocument()
    expect(footerQueries.queryByText('one.jpg · 1 of 2')).not.toBeInTheDocument()
  })

  it('shows original in inspect while compare is held, but keeps exports on the selected filter', async () => {
    useImageQueueMock.mockReturnValue({
      items: [createItem('1', 'one.jpg')],
      message: null,
      addFiles: vi.fn(),
      removeItem: vi.fn(),
      setItemStatus: vi.fn(),
    })

    window.localStorage.setItem(
      borderSettingsStorageKey,
      JSON.stringify({ filterPresetId: 'ember' }),
    )

    render(<BorderToolPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Inspect image' }))

    expect(screen.getByTestId('inspect-filter')).toHaveTextContent('ember')

    const footer = screen.getByLabelText('Workspace footer')
    const compareButton = within(footer).getByRole('button', { name: 'Original' })

    fireEvent.pointerDown(compareButton)

    expect(screen.getByTestId('inspect-filter')).toHaveTextContent('original')

    await userEvent.click(screen.getByRole('button', { name: 'Export ZIP' }))

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

  it('shows original in browse while the original button is held', () => {
    useImageQueueMock.mockReturnValue({
      items: [createItem('1', 'one.jpg')],
      message: null,
      addFiles: vi.fn(),
      removeItem: vi.fn(),
      setItemStatus: vi.fn(),
    })

    window.localStorage.setItem(
      borderSettingsStorageKey,
      JSON.stringify({ filterPresetId: 'ember' }),
    )

    render(<BorderToolPage />)

    expect(screen.getByTestId('browse-filter')).toHaveTextContent('ember')

    const footer = screen.getByLabelText('Workspace footer')
    const originalButton = within(footer).getByRole('button', { name: 'Original' })

    expect(originalButton).toHaveAttribute('aria-pressed', 'false')

    fireEvent.pointerDown(originalButton)
    expect(originalButton).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('browse-filter')).toHaveTextContent('original')

    fireEvent.pointerUp(originalButton)
    expect(originalButton).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('browse-filter')).toHaveTextContent('ember')
  })
})
