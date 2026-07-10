import { useEffect, useMemo, useRef, useState } from 'react'

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
  zoomPercent?: number
}

function scalePreviewPixels(pixels: number, previewScale: number) {
  return Math.max(1, Math.round(pixels * previewScale))
}

function getFullSizePreviewDimensions(width: number, height: number) {
  const maxLongEdge = 2400
  const scale = Math.min(maxLongEdge / width, maxLongEdge / height, 1)

  return {
    scale,
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  }
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
  zoomPercent,
}: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hasError, setHasError] = useState(false)
  const fullSizeDimensions = useMemo(
    () =>
      fullSize ? getFullSizePreviewDimensions(preset.width, preset.height) : null,
    [fullSize, preset.height, preset.width],
  )

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

        if (fullSize && fullSizeDimensions) {
          scale = fullSizeDimensions.scale
          renderWidth = fullSizeDimensions.width
          renderHeight = fullSizeDimensions.height
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
  }, [
    backgroundColor,
    borderWidthPixels,
    edgePixels,
    filterAdjustments,
    fullSize,
    fullSizeDimensions,
    preset.height,
    preset.width,
    sizingMode,
    sourceUrl,
  ])

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
      className={
        fullSize
          ? typeof zoomPercent === 'number'
            ? 'block shrink-0 bg-surface-muted'
            : 'max-h-full max-w-full bg-surface-muted object-contain'
          : 'w-full bg-surface-muted'
      }
      style={
        fullSize && typeof zoomPercent === 'number' && fullSizeDimensions
          ? {
              width: `${Math.round((fullSizeDimensions.width * zoomPercent) / 100)}px`,
              height: 'auto',
            }
          : undefined
      }
    />
  )
}
