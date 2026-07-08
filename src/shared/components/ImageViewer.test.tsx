import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ImageViewer } from '@/shared/components/ImageViewer'
import type { ImageQueueItem, OutputPreset } from '@/shared/types'

const preset: OutputPreset = {
  id: 'instagram-square',
  label: 'Square Post',
  width: 1080,
  height: 1080,
}

const items: ImageQueueItem[] = [
  {
    id: '1',
    file: new File(['jpg'], 'one.jpg', { type: 'image/jpeg' }),
    objectUrl: 'blob:one',
    filename: 'one.jpg',
    mimeType: 'image/jpeg',
    originalWidth: 1000,
    originalHeight: 800,
    status: 'ready',
  },
  {
    id: '2',
    file: new File(['jpg'], 'two.jpg', { type: 'image/jpeg' }),
    objectUrl: 'blob:two',
    filename: 'two.jpg',
    mimeType: 'image/jpeg',
    originalWidth: 1200,
    originalHeight: 900,
    status: 'ready',
  },
  {
    id: '3',
    file: new File(['jpg'], 'three.jpg', { type: 'image/jpeg' }),
    objectUrl: 'blob:three',
    filename: 'three.jpg',
    mimeType: 'image/jpeg',
    originalWidth: 800,
    originalHeight: 600,
    status: 'ready',
  },
]

describe('ImageViewer', () => {
  it('shows filename and position indicator', () => {
    render(
      <ImageViewer
        items={items}
        currentIndex={1}
        preset={preset}
        backgroundColor="#ffffff"
        sizingMode="contain"
        edgePixels={900}
        borderWidthPixels={90}
        onClose={vi.fn()}
        onNavigate={vi.fn()}
      />,
    )

    expect(screen.getByText('two.jpg')).toBeInTheDocument()
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()

    render(
      <ImageViewer
        items={items}
        currentIndex={0}
        preset={preset}
        backgroundColor="#ffffff"
        sizingMode="contain"
        edgePixels={900}
        borderWidthPixels={90}
        onClose={onClose}
        onNavigate={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /close viewer/i }))

    expect(onClose).toHaveBeenCalled()
  })

  it('calls onNavigate with previous index', async () => {
    const onNavigate = vi.fn()
    const user = userEvent.setup()

    render(
      <ImageViewer
        items={items}
        currentIndex={1}
        preset={preset}
        backgroundColor="#ffffff"
        sizingMode="contain"
        edgePixels={900}
        borderWidthPixels={90}
        onClose={vi.fn()}
        onNavigate={onNavigate}
      />,
    )

    await user.click(screen.getByRole('button', { name: /previous image/i }))

    expect(onNavigate).toHaveBeenCalledWith(0)
  })

  it('calls onNavigate with next index', async () => {
    const onNavigate = vi.fn()
    const user = userEvent.setup()

    render(
      <ImageViewer
        items={items}
        currentIndex={1}
        preset={preset}
        backgroundColor="#ffffff"
        sizingMode="contain"
        edgePixels={900}
        borderWidthPixels={90}
        onClose={vi.fn()}
        onNavigate={onNavigate}
      />,
    )

    await user.click(screen.getByRole('button', { name: /next image/i }))

    expect(onNavigate).toHaveBeenCalledWith(2)
  })

  it('hides prev button on first image', () => {
    render(
      <ImageViewer
        items={items}
        currentIndex={0}
        preset={preset}
        backgroundColor="#ffffff"
        sizingMode="contain"
        edgePixels={900}
        borderWidthPixels={90}
        onClose={vi.fn()}
        onNavigate={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: /previous image/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next image/i })).toBeInTheDocument()
  })

  it('hides next button on last image', () => {
    render(
      <ImageViewer
        items={items}
        currentIndex={2}
        preset={preset}
        backgroundColor="#ffffff"
        sizingMode="contain"
        edgePixels={900}
        borderWidthPixels={90}
        onClose={vi.fn()}
        onNavigate={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /previous image/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /next image/i })).not.toBeInTheDocument()
  })
})
