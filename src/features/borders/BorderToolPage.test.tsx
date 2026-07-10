import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

vi.mock('@/shared/components/PreviewCanvas', () => ({
  PreviewCanvas: ({ filterAdjustments }: { filterAdjustments?: { hueRotate?: number } }) => (
    <div data-testid="preview-filter">{filterAdjustments?.hueRotate === -10 ? 'ember' : 'original'}</div>
  ),
}))

vi.mock('@/shared/components/ImageGrid', () => ({
  ImageGrid: ({ filterAdjustments, onPreview }: { filterAdjustments?: { hueRotate?: number }; onPreview?: (index: number) => void }) => (
    <div>
      <div data-testid="grid-filter">{filterAdjustments?.hueRotate === -10 ? 'ember' : 'original'}</div>
      <button type="button" onClick={() => onPreview?.(0)}>Open viewer</button>
    </div>
  ),
}))

vi.mock('@/shared/components/ImageViewer', () => ({
  ImageViewer: ({
    filterAdjustments,
    isCompareActive,
    onCompareStart,
    onCompareEnd,
  }: {
    filterAdjustments?: { hueRotate?: number }
    isCompareActive?: boolean
    onCompareStart?: () => void
    onCompareEnd?: () => void
  }) => (
    <div>
      <div data-testid="viewer-filter">{filterAdjustments?.hueRotate === -10 ? 'ember' : 'original'}</div>
      <div data-testid="viewer-compare-state">{isCompareActive ? 'active' : 'inactive'}</div>
      <button type="button" onClick={onCompareStart}>Viewer compare start</button>
      <button type="button" onClick={onCompareEnd}>Viewer compare end</button>
    </div>
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

describe('BorderToolPage filters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()

    renderProcessedCanvasMock.mockResolvedValue(document.createElement('canvas'))
    canvasToBlobMock.mockResolvedValue(new Blob(['ok'], { type: 'image/png' }))
    exportZipMock.mockImplementation(async ({ items, createEntry }: { items: ImageQueueItem[]; createEntry: (item: ImageQueueItem) => Promise<unknown> }) => {
      await createEntry(items[0])
    })
  })

  it('shows original in preview while compare is held, but keeps exports on the selected filter', async () => {
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

    expect(screen.getByTestId('preview-filter')).toHaveTextContent('ember')

    const compareButton = screen.getByRole('button', { name: 'Hold to compare' })
    fireEvent.pointerDown(compareButton)

    expect(screen.getByTestId('preview-filter')).toHaveTextContent('original')

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
    expect(screen.getByTestId('preview-filter')).toHaveTextContent('ember')
  })

  it('keeps grid filtered but lets the viewer switch to original while compare is active', async () => {
    useImageQueueMock.mockReturnValue({
      items: [createItem('1', 'one.jpg'), createItem('2', 'two.jpg')],
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

    expect(screen.getByTestId('grid-filter')).toHaveTextContent('ember')

    await userEvent.click(screen.getByRole('button', { name: 'Open viewer' }))

    expect(screen.getByTestId('viewer-filter')).toHaveTextContent('ember')
    expect(screen.getByTestId('viewer-compare-state')).toHaveTextContent('inactive')

    await userEvent.click(screen.getByRole('button', { name: 'Viewer compare start' }))

    expect(screen.getByTestId('viewer-filter')).toHaveTextContent('original')
    expect(screen.getByTestId('viewer-compare-state')).toHaveTextContent('active')
    expect(screen.getByTestId('grid-filter')).toHaveTextContent('ember')

    await userEvent.click(screen.getByRole('button', { name: 'Viewer compare end' }))

    expect(screen.getByTestId('viewer-filter')).toHaveTextContent('ember')
    expect(screen.getByTestId('viewer-compare-state')).toHaveTextContent('inactive')
  })
})
