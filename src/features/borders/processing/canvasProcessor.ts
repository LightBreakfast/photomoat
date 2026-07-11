import { buildCanvasFilter, isNeutralFilter } from '@/features/borders/processing/filters'
import type { FilterAdjustments, ImageSizingMode } from '@/features/borders/types'
import { loadImageElement } from '@/shared/utils/imageLoader'

export type ContainRectInput = {
  sourceWidth: number
  sourceHeight: number
  targetWidth: number
  targetHeight: number
}

export type ImagePlacementInput = ContainRectInput & {
  sizingMode?: ImageSizingMode
  edgePixels?: number
  borderWidthPixels?: number
  minVerticalPaddingPixels?: number
}

export type ContainRect = {
  scale: number
  drawWidth: number
  drawHeight: number
  x: number
  y: number
}

type DrawImageOptions = {
  context: CanvasRenderingContext2D
  image: CanvasImageSource & {
    width: number
    height: number
    naturalWidth?: number
    naturalHeight?: number
  }
  targetWidth: number
  targetHeight: number
  backgroundColor: string
  sizingMode?: ImageSizingMode
  edgePixels?: number
  borderWidthPixels?: number
  minVerticalPaddingPixels?: number
  filterAdjustments?: FilterAdjustments
}

type RenderCanvasOptions = {
  sourceUrl: string
  targetWidth: number
  targetHeight: number
  backgroundColor: string
  sizingMode?: ImageSizingMode
  edgePixels?: number
  borderWidthPixels?: number
  minVerticalPaddingPixels?: number
  filterAdjustments?: FilterAdjustments
}

const previewMaxEdge = 720

export function calculateContainRect({
  sourceWidth,
  sourceHeight,
  targetWidth,
  targetHeight,
}: ContainRectInput): ContainRect {
  const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight)
  const drawWidth = sourceWidth * scale
  const drawHeight = sourceHeight * scale
  const x = (targetWidth - drawWidth) / 2
  const y = (targetHeight - drawHeight) / 2

  return { scale, drawWidth, drawHeight, x, y }
}

function getClampedHorizontalPadding(borderWidthPixels: number, targetWidth: number) {
  return Math.max(0, Math.min(Math.round(borderWidthPixels), Math.floor((targetWidth - 1) / 2)))
}

function getClampedVerticalPadding(minVerticalPaddingPixels: number, targetHeight: number) {
  return Math.max(
    0,
    Math.min(Math.round(minVerticalPaddingPixels), Math.floor((targetHeight - 1) / 2)),
  )
}

type InsetRect = {
  x: number
  y: number
  width: number
  height: number
}

function calculateFixedSidesInsetRect(
  targetWidth: number,
  targetHeight: number,
  borderWidthPixels: number,
  minVerticalPaddingPixels: number,
): InsetRect | null {
  const clampedSidePadding = getClampedHorizontalPadding(borderWidthPixels, targetWidth)
  const clampedVerticalPadding = getClampedVerticalPadding(minVerticalPaddingPixels, targetHeight)
  const innerWidth = targetWidth - clampedSidePadding * 2
  const innerHeight = targetHeight - clampedVerticalPadding * 2

  if (innerWidth <= 0 || innerHeight <= 0) {
    return null
  }

  return {
    x: clampedSidePadding,
    y: clampedVerticalPadding,
    width: innerWidth,
    height: innerHeight,
  }
}

export function calculateImagePlacementRect({
  sourceWidth,
  sourceHeight,
  targetWidth,
  targetHeight,
  sizingMode = 'contain',
  edgePixels,
  borderWidthPixels,
  minVerticalPaddingPixels,
}: ImagePlacementInput): ContainRect {
  const containRect = calculateContainRect({
    sourceWidth,
    sourceHeight,
    targetWidth,
    targetHeight,
  })

  if (sizingMode === 'border-width' && borderWidthPixels && borderWidthPixels > 0) {
    const clampedHorizontalPadding = getClampedHorizontalPadding(borderWidthPixels, targetWidth)
    const contentRect = calculateContainRect({
      sourceWidth,
      sourceHeight,
      targetWidth: targetWidth - clampedHorizontalPadding * 2,
      targetHeight,
    })

    return {
      scale: contentRect.scale,
      drawWidth: contentRect.drawWidth,
      drawHeight: contentRect.drawHeight,
      x: clampedHorizontalPadding + contentRect.x,
      y: contentRect.y,
    }
  }

  if (
    sizingMode === 'fixed-sides' &&
    borderWidthPixels &&
    borderWidthPixels > 0
  ) {
    const insetRect = calculateFixedSidesInsetRect(
      targetWidth,
      targetHeight,
      borderWidthPixels,
      minVerticalPaddingPixels ?? borderWidthPixels,
    )

    if (!insetRect) {
      return containRect
    }

    const scale = insetRect.width / sourceWidth
    const drawWidth = insetRect.width
    const drawHeight = sourceHeight * scale
    const x = insetRect.x
    const y = (targetHeight - drawHeight) / 2

    return { scale, drawWidth, drawHeight, x, y }
  }

  if (sizingMode === 'fill') {
    const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight)
    const drawWidth = sourceWidth * scale
    const drawHeight = sourceHeight * scale
    const x = (targetWidth - drawWidth) / 2
    const y = (targetHeight - drawHeight) / 2

    return { scale, drawWidth, drawHeight, x, y }
  }

  if (sizingMode === 'contain' || !edgePixels || edgePixels <= 0) {
    return containRect
  }

  const sourceEdge =
    sizingMode === 'long-edge'
      ? Math.max(sourceWidth, sourceHeight)
      : Math.min(sourceWidth, sourceHeight)

  const requestedScale = edgePixels / sourceEdge
  const scale = Math.min(requestedScale, containRect.scale)
  const drawWidth = sourceWidth * scale
  const drawHeight = sourceHeight * scale
  const x = (targetWidth - drawWidth) / 2
  const y = (targetHeight - drawHeight) / 2

  return { scale, drawWidth, drawHeight, x, y }
}

export function getPreviewCanvasSize(width: number, height: number) {
  if (width >= height) {
    return {
      width: previewMaxEdge,
      height: Math.round((height / width) * previewMaxEdge),
    }
  }

  return {
    width: Math.round((width / height) * previewMaxEdge),
    height: previewMaxEdge,
  }
}

export function drawImageOnCanvas({
  context,
  image,
  targetWidth,
  targetHeight,
  backgroundColor,
  sizingMode,
  edgePixels,
  borderWidthPixels,
  minVerticalPaddingPixels,
  filterAdjustments,
}: DrawImageOptions) {
  const canvas = context.canvas
  canvas.width = targetWidth
  canvas.height = targetHeight

  context.fillStyle = backgroundColor
  context.fillRect(0, 0, targetWidth, targetHeight)

  const sourceWidth = image.naturalWidth ?? image.width
  const sourceHeight = image.naturalHeight ?? image.height

  const { drawWidth, drawHeight, x, y } = calculateImagePlacementRect({
    sourceWidth,
    sourceHeight,
    targetWidth,
    targetHeight,
    sizingMode,
    edgePixels,
    borderWidthPixels,
    minVerticalPaddingPixels,
  })

  const fixedSidesInsetRect =
    sizingMode === 'fixed-sides' && borderWidthPixels && borderWidthPixels > 0
      ? calculateFixedSidesInsetRect(
          targetWidth,
          targetHeight,
          borderWidthPixels,
          minVerticalPaddingPixels ?? borderWidthPixels,
        )
      : null

  if (fixedSidesInsetRect) {
    context.save()
    context.beginPath()
    context.rect(
      fixedSidesInsetRect.x,
      fixedSidesInsetRect.y,
      fixedSidesInsetRect.width,
      fixedSidesInsetRect.height,
    )
    context.clip()
  }

  try {
    if (filterAdjustments && !isNeutralFilter(filterAdjustments)) {
      context.filter = buildCanvasFilter(filterAdjustments)
    }

    context.drawImage(image, x, y, drawWidth, drawHeight)
    context.filter = 'none'
  } finally {
    if (fixedSidesInsetRect) {
      context.restore()
    }
  }
}

export async function renderProcessedCanvas({
  sourceUrl,
  targetWidth,
  targetHeight,
  backgroundColor,
  sizingMode,
  edgePixels,
  borderWidthPixels,
  minVerticalPaddingPixels,
  filterAdjustments,
}: RenderCanvasOptions) {
  const image = await loadImageElement(sourceUrl)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas processing is not available in this browser.')
  }

  drawImageOnCanvas({
    context,
    image,
    targetWidth,
    targetHeight,
    backgroundColor,
    sizingMode,
    edgePixels,
    borderWidthPixels,
    minVerticalPaddingPixels,
    filterAdjustments,
  })

  return canvas
}
