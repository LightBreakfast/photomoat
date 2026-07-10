import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ImageViewer } from '@/shared/components/ImageViewer'
import type { ImageQueueItem, OutputPreset } from '@/shared/types'

vi.mock('@/shared/components/PreviewCanvas', () => ({
  PreviewCanvas: ({ label }: { label: string }) => <div>{label}</div>,
}))

const item: ImageQueueItem = {
  id: '1',
  file: new File(['data'], 'test.jpg', { type: 'image/jpeg' }),
  objectUrl: 'blob:test',
  filename: 'test.jpg',
  mimeType: 'image/jpeg',
  status: 'ready',
}

const preset: OutputPreset = {
  id: 'instagram-square',
  label: 'Square Post',
  width: 1080,
  height: 1080,
}

describe('ImageViewer', () => {
  it('renders a Hold to compare button when compare handlers are provided', () => {
    render(
      <ImageViewer
        items={[item]}
        currentIndex={0}
        preset={preset}
        backgroundColor="#ffffff"
        sizingMode="contain"
        edgePixels={900}
        borderWidthPixels={90}
        onCompareStart={vi.fn()}
        onCompareEnd={vi.fn()}
        onClose={vi.fn()}
        onNavigate={vi.fn()}
      />, 
    )

    expect(screen.getByRole('button', { name: 'Hold to compare' })).toBeInTheDocument()
  })

  it('calls compare handlers on pointer down/up', async () => {
    const onCompareStart = vi.fn()
    const onCompareEnd = vi.fn()

    render(
      <ImageViewer
        items={[item]}
        currentIndex={0}
        preset={preset}
        backgroundColor="#ffffff"
        sizingMode="contain"
        edgePixels={900}
        borderWidthPixels={90}
        onCompareStart={onCompareStart}
        onCompareEnd={onCompareEnd}
        onClose={vi.fn()}
        onNavigate={vi.fn()}
      />, 
    )

    const compareButton = screen.getByRole('button', { name: 'Hold to compare' })

    fireEvent.pointerDown(compareButton)
    fireEvent.pointerUp(compareButton)

    expect(onCompareStart).toHaveBeenCalled()
    expect(onCompareEnd).toHaveBeenCalled()
  })

  it('reflects active compare state', () => {
    render(
      <ImageViewer
        items={[item]}
        currentIndex={0}
        preset={preset}
        backgroundColor="#ffffff"
        sizingMode="contain"
        edgePixels={900}
        borderWidthPixels={90}
        isCompareActive
        onCompareStart={vi.fn()}
        onCompareEnd={vi.fn()}
        onClose={vi.fn()}
        onNavigate={vi.fn()}
      />, 
    )

    expect(screen.getByRole('button', { name: 'Hold to compare' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})
