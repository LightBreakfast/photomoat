import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ImageGrid } from '@/shared/components/ImageGrid'
import type { ImageQueueItem, OutputPreset } from '@/shared/types'

const preset: OutputPreset = {
  id: 'instagram-square',
  label: 'Square Post',
  width: 1080,
  height: 1080,
}

const item: ImageQueueItem = {
  id: '1',
  file: new File(['jpg'], 'portrait.jpg', { type: 'image/jpeg' }),
  objectUrl: 'blob:portrait.jpg',
  filename: 'portrait.jpg',
  mimeType: 'image/jpeg',
  originalWidth: 1000,
  originalHeight: 800,
  status: 'error',
  error: 'This image could not be loaded.',
}

describe('ImageGrid', () => {
  it('renders nothing when no items exist', () => {
    const { container } = render(
      <ImageGrid
        items={[]}
        preset={preset}
        backgroundColor="#ffffff"
        sizingMode="contain"
        edgePixels={900}
        borderWidthPixels={90}
        onRemove={vi.fn()}
        onDownload={vi.fn()}
      />,
    )

    expect(container.innerHTML).toBe('')
  })

  it('renders queued items', () => {
    render(
      <ImageGrid
        items={[item]}
        preset={preset}
        backgroundColor="#ffffff"
        sizingMode="contain"
        edgePixels={900}
        borderWidthPixels={90}
        onRemove={vi.fn()}
        onDownload={vi.fn()}
      />,
    )

    expect(screen.getByText('portrait.jpg')).toBeInTheDocument()
    expect(screen.getByText('This image could not be loaded.')).toBeInTheDocument()
  })

  it('renders icon buttons with aria-labels', () => {
    render(
      <ImageGrid
        items={[
          {
            ...item,
            status: 'ready',
            error: undefined,
          },
        ]}
        preset={preset}
        backgroundColor="#ffffff"
        sizingMode="contain"
        edgePixels={900}
        borderWidthPixels={90}
        onRemove={vi.fn()}
        onDownload={vi.fn()}
        onPreview={vi.fn()}
        onToggleSelect={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /remove portrait/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /download portrait/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /expand preview/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /select portrait/i })).toBeInTheDocument()
  })

  it('shows selected state on checkbox when isSelected is true', () => {
    render(
      <ImageGrid
        items={[
          {
            ...item,
            status: 'ready',
            error: undefined,
          },
        ]}
        preset={preset}
        backgroundColor="#ffffff"
        sizingMode="contain"
        edgePixels={900}
        borderWidthPixels={90}
        selectedIds={new Set(['1'])}
        onRemove={vi.fn()}
        onDownload={vi.fn()}
        onToggleSelect={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /deselect portrait/i })).toBeInTheDocument()
  })

  it('calls onToggleSelect when checkbox is clicked', () => {
    const onToggleSelect = vi.fn()

    render(
      <ImageGrid
        items={[
          {
            ...item,
            status: 'ready',
            error: undefined,
          },
        ]}
        preset={preset}
        backgroundColor="#ffffff"
        sizingMode="contain"
        edgePixels={900}
        borderWidthPixels={90}
        onRemove={vi.fn()}
        onDownload={vi.fn()}
        onToggleSelect={onToggleSelect}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /select portrait/i }))

    expect(onToggleSelect).toHaveBeenCalledWith('1', expect.objectContaining({ metaKey: false, ctrlKey: false }))
  })
})
