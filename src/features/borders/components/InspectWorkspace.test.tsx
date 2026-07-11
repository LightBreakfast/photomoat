import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { InspectWorkspace } from '@/features/borders/components/InspectWorkspace'
import type { ImageQueueItem, OutputPreset } from '@/shared/types'

vi.mock('@/shared/components/PreviewCanvas', () => ({
  PreviewCanvas: ({ label, zoomPercent }: { label: string; zoomPercent?: number }) => (
    <div data-testid="preview-canvas" data-zoom-percent={zoomPercent ?? 'fit'}>
      {label}
    </div>
  ),
}))

const item: ImageQueueItem = {
  id: '2',
  file: new File(['data'], 'two.jpg', { type: 'image/jpeg' }),
  objectUrl: 'blob:2',
  filename: 'two.jpg',
  mimeType: 'image/jpeg',
  status: 'ready',
}

const preset: OutputPreset = {
  id: 'instagram-square',
  label: 'Square Post',
  width: 1080,
  height: 1080,
}

function renderWorkspace(
  overrides?: Partial<React.ComponentProps<typeof InspectWorkspace>>,
) {
  return render(
    <InspectWorkspace
      item={item}
      preset={preset}
      backgroundColor="#ffffff"
      sizingMode="contain"
      edgePixels={900}
      borderWidthPixels={90}
      minVerticalPaddingPixels={90}
      inspectZoom={{ mode: 'fit' }}
      {...overrides}
    />,
  )
}

describe('InspectWorkspace', () => {
  it('renders nothing when there is no active item', () => {
    const { container } = renderWorkspace({ item: null })

    expect(container).toBeEmptyDOMElement()
  })

  it('renders the active image preview', () => {
    renderWorkspace()

    expect(screen.getByTestId('preview-canvas')).toHaveTextContent('Inspect: two.jpg')
  })

  it('uses fit mode by default', () => {
    renderWorkspace()

    expect(screen.getByTestId('preview-canvas')).toHaveAttribute('data-zoom-percent', 'fit')
  })

  it('passes the selected zoom percent to PreviewCanvas', () => {
    renderWorkspace({ inspectZoom: { mode: 'percent', percent: 200 } })

    expect(screen.getByTestId('preview-canvas')).toHaveAttribute('data-zoom-percent', '200')
  })

  it('uses an overflow container when zoomed in', () => {
    const { container } = renderWorkspace({
      inspectZoom: { mode: 'percent', percent: 100 },
    })

    expect(container.firstChild).toHaveClass('overflow-auto')
  })
})
