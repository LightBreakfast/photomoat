import { buildCanvasFilter, isNeutralFilter } from '@/features/borders/processing/filters'
import type { FilterAdjustments, ImageSizingMode, SourceTransformOptions } from '@/features/borders/types'
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

type TransformableSource = CanvasImageSource & {
  width: number
  height: number
  naturalWidth?: number
  naturalHeight?: number
}

type DrawImageOptions = {
  context: CanvasRenderingContext2D
  image: TransformableSource
  targetWidth: number
  targetHeight: number
  backgroundColor: string
  sizingMode?: ImageSizingMode
  edgePixels?: number
  borderWidthPixels?: number
  minVerticalPaddingPixels?: number
  filterAdjustments?: FilterAdjustments
  rotationDegrees?: number
  flipHorizontal?: boolean
  flipVertical?: boolean
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
  rotationDegrees?: number
  flipHorizontal?: boolean
  flipVertical?: boolean
}

export type SourceTransformMatrix = {
  width: number
  height: number
  a: number
  b: number
  c: number
  d: number
  e: number
  f: number
}

const previewMaxEdge = 720

/**
 * Pure transform math for rotating/flipping a source image.
 *
 * Returns the destination canvas size plus a 2D matrix (setTransform args) that
 * maps source pixels to the destination. Flips are applied in view space (after
 * rotation), matching image editors: rotate 90° then "flip horizontal" mirrors
 * the rotated image left/right. Returns `null` when no transform is needed.
 *
 * For quarter turns the sin/cos values are snapped to exact 0/±1 so edges stay
 * pixel-clean; any other angle gets a bounding-box canvas.
 */
export function computeSourceTransform(
  sourceWidth: number,
  sourceHeight: number,
  { rotationDegrees = 0, flipHorizontal = false, flipVertical = false }: SourceTransformOptions = {},
): SourceTransformMatrix | null {
  const angle = ((rotationDegrees % 360) + 360) % 360
  const needsRotation = angle !== 0
  const needsFlip = flipHorizontal || flipVertical

  if (!needsRotation && !needsFlip) {
    return null
  }

  const snappedAngle = Math.round(angle / 90) * 90
  const useAngle = Math.abs(angle - snappedAngle) < 1e-6 ? snappedAngle : angle
  const radians = (useAngle * Math.PI) / 180
  const rawCos = Math.cos(radians)
  const rawSin = Math.sin(radians)
  const cos = Math.abs(rawCos) < 1e-9 ? 0 : rawCos
  const sin = Math.abs(rawSin) < 1e-9 ? 0 : rawSin

  const width = Math.max(1, Math.round(Math.abs(sourceWidth * cos) + Math.abs(sourceHeight * sin)))
  const height = Math.max(1, Math.round(Math.abs(sourceWidth * sin) + Math.abs(sourceHeight * cos)))

  // M = T(center) · F · R, where F = diag(fx, fy). Expanding F·R gives:
  //   a = fx·cos   b = fy·sin   c = -fx·sin   d = fy·cos
  const fx = flipHorizontal ? -1 : 1
  const fy = flipVertical ? -1 : 1

  const a = fx * cos === 0 ? 0 : fx * cos
  const b = fy * sin === 0 ? 0 : fy * sin
  const c = -fx * sin === 0 ? 0 : -fx * sin
  const d = fy * cos === 0 ? 0 : fy * cos

  return {
    width,
    height,
    a,
    b,
    c,
    d,
    e: width / 2,
    f: height / 2,
  }
}

/**
 * Renders the source image rotated/flipped onto an offscreen canvas.
 * Returns the original image unchanged when no transform is needed (or the
 * canvas 2D context is unavailable).
 */
export function applySourceTransform(
  image: TransformableSource,
  options: SourceTransformOptions = {},
): TransformableSource {
  const sourceWidth = image.naturalWidth ?? image.width
  const sourceHeight = image.naturalHeight ?? image.height
  const transform = computeSourceTransform(sourceWidth, sourceHeight, options)

  if (!transform) {
    return image
  }

  const canvas = document.createElement('canvas')
  canvas.width = transform.width
  canvas.height = transform.height
  const context = canvas.getContext('2d')

  if (!context) {
    return image
  }

  context.setTransform(transform.a, transform.b, transform.c, transform.d, transform.e, transform.f)
  context.drawImage(image, -sourceWidth / 2, -sourceHeight / 2)

  return canvas
}

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
  rotationDegrees,
  flipHorizontal,
  flipVertical,
}: DrawImageOptions) {
  const canvas = context.canvas
  canvas.width = targetWidth
  canvas.height = targetHeight

  context.fillStyle = backgroundColor
  context.fillRect(0, 0, targetWidth, targetHeight)

  // Rotate/flip the source first, then run the existing placement math on the
  // transformed dimensions. The border pipeline is untouched.
  const source = applySourceTransform(image, { rotationDegrees, flipHorizontal, flipVertical })
  const sourceWidth = source.naturalWidth ?? source.width
  const sourceHeight = source.naturalHeight ?? source.height

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

    context.drawImage(source, x, y, drawWidth, drawHeight)
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
  rotationDegrees,
  flipHorizontal,
  flipVertical,
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
    rotationDegrees,
    flipHorizontal,
    flipVertical,
  })

  return canvas
}
