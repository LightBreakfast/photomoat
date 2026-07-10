import { useEffect, useRef, useState } from 'react'

import type { FilterAdjustments, ImageSizingMode } from '@/features/borders/types'
import type { OutputPreset } from '@/shared/types'
import { drawImageOnCanvas, getPreviewCanvasSize } from '@/features/borders/processing/canvasProcessor'
import { loadImageElement } from '@/shared/utils/imageLoader'

type PreviewCanvasProps = {
  sourceUrl: string
  preset: OutputPreset
  backgroundColor: string
  sizingMode: ImageSizingMode
  edgePixels: number
  borderWidthPixels: number
  filterAdjustments?: FilterAdjustments
  label: string
  fullSize?: boolean
}

function scalePreviewPixels(pixels: number, previewScale: number) {
  return Math.max(1, Math.round(pixels * previewScale))
}

export function PreviewCanvas({
  sourceUrl,
  preset,
  backgroundColor,
  sizingMode,
  edgePixels,
  borderWidthPixels,
  filterAdjustments,
  label,
  fullSize = false,
}: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function renderPreview() {
      const canvas = canvasRef.current

      if (!canvas) {
        return
      }

      try {
        const image = await loadImageElement(sourceUrl)

        if (!isMounted) {
          return
        }

        let renderWidth: number
        let renderHeight: number
        let scale: number

        if (fullSize) {
          const maxDim = 1200
          scale = Math.min(maxDim / preset.width, maxDim / preset.height, 1)
          renderWidth = Math.round(preset.width * scale)
          renderHeight = Math.round(preset.height * scale)
        } else {
          const previewSize = getPreviewCanvasSize(preset.width, preset.height)
          scale = Math.min(
            previewSize.width / preset.width,
            previewSize.height / preset.height,
          )
          renderWidth = previewSize.width
          renderHeight = previewSize.height
        }

        canvas.width = renderWidth
        canvas.height = renderHeight

        const context = canvas.getContext('2d')

        if (!context) {
          throw new Error('Preview rendering is not available.')
        }

        drawImageOnCanvas({
          context,
          image,
          targetWidth: renderWidth,
          targetHeight: renderHeight,
          backgroundColor,
          sizingMode,
          edgePixels: scalePreviewPixels(edgePixels, scale),
          borderWidthPixels: scalePreviewPixels(borderWidthPixels, scale),
          filterAdjustments,
        })
        setHasError(false)
      } catch {
        if (isMounted) {
          setHasError(true)
        }
      }
    }

    void renderPreview()

    return () => {
      isMounted = false
    }
  }, [backgroundColor, borderWidthPixels, edgePixels, filterAdjustments, fullSize, preset.height, preset.width, sizingMode, sourceUrl])

  if (hasError) {
    return (
      <div className="flex aspect-square items-center justify-center border border-border bg-surface-muted p-4 text-sm text-danger">
        Preview unavailable
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      aria-label={label}
      className={fullSize ? 'max-h-full max-w-full object-contain' : 'w-full bg-surface-muted'}
    />
  )
}
