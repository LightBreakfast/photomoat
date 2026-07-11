import { describe, expect, it, vi } from 'vitest'

import { resolveFilterAdjustments } from '@/features/borders/filterPresets'
import {
  calculateContainRect,
  calculateImagePlacementRect,
  drawImageOnCanvas,
  getPreviewCanvasSize,
} from '@/features/borders/processing/canvasProcessor'
import { buildCanvasFilter } from '@/features/borders/processing/filters'

describe('calculateContainRect', () => {
  it('fits a portrait image inside a square canvas', () => {
    expect(
      calculateContainRect({
        sourceWidth: 800,
        sourceHeight: 1200,
        targetWidth: 1080,
        targetHeight: 1080,
      }),
    ).toEqual({
      scale: 0.9,
      drawWidth: 720,
      drawHeight: 1080,
      x: 180,
      y: 0,
    })
  })

  it('fits a landscape image inside a square canvas', () => {
    expect(
      calculateContainRect({
        sourceWidth: 1600,
        sourceHeight: 900,
        targetWidth: 1080,
        targetHeight: 1080,
      }),
    ).toEqual({
      scale: 0.675,
      drawWidth: 1080,
      drawHeight: 607.5,
      x: 0,
      y: 236.25,
    })
  })

  it('fits a square image inside a portrait canvas', () => {
    expect(
      calculateContainRect({
        sourceWidth: 1200,
        sourceHeight: 1200,
        targetWidth: 1080,
        targetHeight: 1350,
      }),
    ).toEqual({
      scale: 0.9,
      drawWidth: 1080,
      drawHeight: 1080,
      x: 0,
      y: 135,
    })
  })

  it('targets the long edge when requested', () => {
    expect(
      calculateImagePlacementRect({
        sourceWidth: 800,
        sourceHeight: 1200,
        targetWidth: 1080,
        targetHeight: 1080,
        sizingMode: 'long-edge',
        edgePixels: 900,
      }),
    ).toEqual({
      scale: 0.75,
      drawWidth: 600,
      drawHeight: 900,
      x: 240,
      y: 90,
    })
  })

  it('targets the short edge when requested', () => {
    expect(
      calculateImagePlacementRect({
        sourceWidth: 800,
        sourceHeight: 1200,
        targetWidth: 1080,
        targetHeight: 1350,
        sizingMode: 'short-edge',
        edgePixels: 900,
      }),
    ).toEqual({
      scale: 1.125,
      drawWidth: 900,
      drawHeight: 1350,
      x: 90,
      y: 0,
    })
  })

  it('caps requested edge sizes so the image still fits', () => {
    expect(
      calculateImagePlacementRect({
        sourceWidth: 800,
        sourceHeight: 1200,
        targetWidth: 1080,
        targetHeight: 1080,
        sizingMode: 'short-edge',
        edgePixels: 900,
      }),
    ).toEqual({
      scale: 0.9,
      drawWidth: 720,
      drawHeight: 1080,
      x: 180,
      y: 0,
    })
  })

  it('preserves the requested horizontal padding when it fits', () => {
    expect(
      calculateImagePlacementRect({
        sourceWidth: 1600,
        sourceHeight: 900,
        targetWidth: 1080,
        targetHeight: 1080,
        sizingMode: 'border-width',
        borderWidthPixels: 90,
      }),
    ).toEqual({
      scale: 0.5625,
      drawWidth: 900,
      drawHeight: 506.25,
      x: 90,
      y: 286.875,
    })
  })

  it('increases horizontal padding when preserving it exactly would overflow the height', () => {
    expect(
      calculateImagePlacementRect({
        sourceWidth: 800,
        sourceHeight: 1200,
        targetWidth: 1080,
        targetHeight: 1080,
        sizingMode: 'border-width',
        borderWidthPixels: 90,
      }),
    ).toEqual({
      scale: 0.9,
      drawWidth: 720,
      drawHeight: 1080,
      x: 180,
      y: 0,
    })
  })

  it('clamps horizontal padding to the preset bounds', () => {
    expect(
      calculateImagePlacementRect({
        sourceWidth: 1200,
        sourceHeight: 1200,
        targetWidth: 1080,
        targetHeight: 1080,
        sizingMode: 'border-width',
        borderWidthPixels: 700,
      }),
    ).toEqual({
      scale: 0.0016666666666666668,
      drawWidth: 2,
      drawHeight: 2,
      x: 539,
      y: 539,
    })
  })

  it('creates bounded preview sizes', () => {
    expect(getPreviewCanvasSize(1080, 1920)).toEqual({ width: 405, height: 720 })
  })
})

describe('calculateImagePlacementRect fill mode', () => {
  it('covers a portrait image in a square canvas (crops top/bottom)', () => {
    expect(
      calculateImagePlacementRect({
        sourceWidth: 800,
        sourceHeight: 1200,
        targetWidth: 1080,
        targetHeight: 1080,
        sizingMode: 'fill',
      }),
    ).toEqual({
      scale: 1.35,
      drawWidth: 1080,
      drawHeight: 1620,
      x: 0,
      y: -270,
    })
  })

  it('covers a landscape image in a square canvas (crops left/right)', () => {
    expect(
      calculateImagePlacementRect({
        sourceWidth: 1600,
        sourceHeight: 900,
        targetWidth: 1080,
        targetHeight: 1080,
        sizingMode: 'fill',
      }),
    ).toEqual({
      scale: 1.2,
      drawWidth: 1920,
      drawHeight: 1080,
      x: -420,
      y: 0,
    })
  })

  it('covers a square image in a portrait canvas (crops top/bottom)', () => {
    expect(
      calculateImagePlacementRect({
        sourceWidth: 1200,
        sourceHeight: 1200,
        targetWidth: 1080,
        targetHeight: 1350,
        sizingMode: 'fill',
      }),
    ).toEqual({
      scale: 1.125,
      drawWidth: 1350,
      drawHeight: 1350,
      x: -135,
      y: 0,
    })
  })
})

describe('drawImageOnCanvas filters', () => {
  it('applies the canvas filter only while drawing the image', () => {
    const calls: string[] = []
    const filterAdjustments = resolveFilterAdjustments('ember')
    const expectedFilter = buildCanvasFilter(filterAdjustments)

    const context = {
      canvas: { width: 0, height: 0 },
      fillStyle: '',
      filter: 'none',
      fillRect: vi.fn(() => {
        calls.push(`fill:${context.filter}`)
      }),
      drawImage: vi.fn(() => {
        calls.push(`draw:${context.filter}`)
      }),
    } as unknown as CanvasRenderingContext2D

    const image = { width: 1200, height: 1200 } as CanvasImageSource & {
      width: number
      height: number
    }

    drawImageOnCanvas({
      context,
      image,
      targetWidth: 1080,
      targetHeight: 1080,
      backgroundColor: '#ffffff',
      filterAdjustments,
    })

    expect(calls).toEqual([
      'fill:none',
      `draw:${expectedFilter}`,
    ])
    expect(context.filter).toBe('none')
  })

  it('keeps neutral filters from affecting the render context', () => {
    const calls: string[] = []

    const context = {
      canvas: { width: 0, height: 0 },
      fillStyle: '',
      filter: 'none',
      fillRect: vi.fn(() => {
        calls.push(`fill:${context.filter}`)
      }),
      drawImage: vi.fn(() => {
        calls.push(`draw:${context.filter}`)
      }),
    } as unknown as CanvasRenderingContext2D

    const image = { width: 1200, height: 1200 } as CanvasImageSource & {
      width: number
      height: number
    }

    drawImageOnCanvas({
      context,
      image,
      targetWidth: 1080,
      targetHeight: 1080,
      backgroundColor: '#ffffff',
      filterAdjustments: resolveFilterAdjustments('original'),
    })

    expect(calls).toEqual([
      'fill:none',
      'draw:none',
    ])
    expect(context.filter).toBe('none')
  })
})
