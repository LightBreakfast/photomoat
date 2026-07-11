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

describe('calculateImagePlacementRect fixed-sides mode', () => {
  it('preserves exact side padding and allows extra vertical padding for landscape sources', () => {
    // innerWidth = 1080 - 180 = 900
    // scale = 900 / 1600 = 0.5625
    // draw = 900x506.25, centered vertically => y = 286.875
    expect(
      calculateImagePlacementRect({
        sourceWidth: 1600,
        sourceHeight: 900,
        targetWidth: 1080,
        targetHeight: 1080,
        sizingMode: 'fixed-sides',
        borderWidthPixels: 90,
        minVerticalPaddingPixels: 90,
      }),
    ).toEqual({
      scale: 0.5625,
      drawWidth: 900,
      drawHeight: 506.25,
      x: 90,
      y: 286.875,
    })
  })

  it('preserves exact side padding and crops vertically when the minimum top and bottom padding cannot fit naturally', () => {
    // innerWidth = 900
    // scale = 900 / 800 = 1.125
    // draw = 900x1350, centered vertically => y = -135
    // drawImageOnCanvas clips this to the 90..990 inset
    expect(
      calculateImagePlacementRect({
        sourceWidth: 800,
        sourceHeight: 1200,
        targetWidth: 1080,
        targetHeight: 1080,
        sizingMode: 'fixed-sides',
        borderWidthPixels: 90,
        minVerticalPaddingPixels: 90,
      }),
    ).toEqual({
      scale: 1.125,
      drawWidth: 900,
      drawHeight: 1350,
      x: 90,
      y: -135,
    })
  })

  it('allows extra vertical padding for square sources in portrait canvases', () => {
    // innerWidth = 900
    // scale = 900 / 1200 = 0.75
    // draw = 900x900, centered vertically => y = 225 (> min 90)
    expect(
      calculateImagePlacementRect({
        sourceWidth: 1200,
        sourceHeight: 1200,
        targetWidth: 1080,
        targetHeight: 1350,
        sizingMode: 'fixed-sides',
        borderWidthPixels: 90,
        minVerticalPaddingPixels: 90,
      }),
    ).toEqual({
      scale: 0.75,
      drawWidth: 900,
      drawHeight: 900,
      x: 90,
      y: 225,
    })
  })

  it('still overflows vertically when exact side padding makes the image too tall', () => {
    // innerWidth = 900
    // scale = 900 / 1600 = 0.5625
    // draw = 900x506.25, centered vertically => y = -3.125
    // drawImageOnCanvas clips this to the 20..480 inset
    expect(
      calculateImagePlacementRect({
        sourceWidth: 1600,
        sourceHeight: 900,
        targetWidth: 1080,
        targetHeight: 500,
        sizingMode: 'fixed-sides',
        borderWidthPixels: 90,
        minVerticalPaddingPixels: 20,
      }),
    ).toEqual({
      scale: 0.5625,
      drawWidth: 900,
      drawHeight: 506.25,
      x: 90,
      y: -3.125,
    })
  })

  it('clamps side padding to valid bounds', () => {
    // sidePadding clamped to 539, innerWidth = 2
    // scale = 2 / 800 = 0.0025
    // draw = 2x3, centered vertically => y = 538.5
    expect(
      calculateImagePlacementRect({
        sourceWidth: 800,
        sourceHeight: 1200,
        targetWidth: 1080,
        targetHeight: 1080,
        sizingMode: 'fixed-sides',
        borderWidthPixels: 700,
        minVerticalPaddingPixels: 100,
      }),
    ).toEqual({
      scale: 0.0025,
      drawWidth: 2,
      drawHeight: 3,
      x: 539,
      y: 538.5,
    })
  })

  it('produces a tiny image when padding leaves almost no inner rect', () => {
    // sidePadding clamped to 539, innerWidth = 2
    // verticalPadding clamped to 539
    // scale = 2 / 800 = 0.0025
    // draw = 2x3, centered vertically => y = 538.5
    expect(
      calculateImagePlacementRect({
        sourceWidth: 800,
        sourceHeight: 1200,
        targetWidth: 1080,
        targetHeight: 1080,
        sizingMode: 'fixed-sides',
        borderWidthPixels: 540,
        minVerticalPaddingPixels: 540,
      }),
    ).toEqual({
      scale: 0.0025,
      drawWidth: 2,
      drawHeight: 3,
      x: 539,
      y: 538.5,
    })
  })

  it('does not crop near-preset portrait images when width-fit already exceeds the minimum vertical padding', () => {
    const placement = calculateImagePlacementRect({
      sourceWidth: 2995,
      sourceHeight: 3531,
      targetWidth: 1080,
      targetHeight: 1350,
      sizingMode: 'fixed-sides',
      borderWidthPixels: 120,
      minVerticalPaddingPixels: 160,
    })

    expect(placement.scale).toBeCloseTo(0.28046744574290483)
    expect(placement.drawWidth).toBeCloseTo(840)
    expect(placement.drawHeight).toBeCloseTo(990.330550918197)
    expect(placement.x).toBeCloseTo(120)
    expect(placement.y).toBeCloseTo(179.8347245409015)
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

describe('drawImageOnCanvas fixed-sides clipping', () => {
  it('keeps exact side padding and avoids cropping when width-fit already exceeds the minimum vertical padding', () => {
    const calls: string[] = []

    const context = {
      canvas: { width: 0, height: 0 },
      fillStyle: '',
      filter: 'none',
      save: vi.fn(() => calls.push('save')),
      beginPath: vi.fn(() => calls.push('beginPath')),
      rect: vi.fn((x: number, y: number, width: number, height: number) => {
        calls.push(`rect:${x},${y},${width},${height}`)
      }),
      clip: vi.fn(() => calls.push('clip')),
      fillRect: vi.fn(() => calls.push('fillRect')),
      drawImage: vi.fn((_: unknown, x: number, y: number, width: number, height: number) => {
        calls.push(`draw:${x},${y},${width},${height}`)
      }),
      restore: vi.fn(() => calls.push('restore')),
    } as unknown as CanvasRenderingContext2D

    const image = { width: 2995, height: 3531 } as CanvasImageSource & {
      width: number
      height: number
    }

    drawImageOnCanvas({
      context,
      image,
      targetWidth: 1080,
      targetHeight: 1350,
      backgroundColor: '#ffffff',
      sizingMode: 'fixed-sides',
      borderWidthPixels: 120,
      minVerticalPaddingPixels: 160,
    })

    expect(calls).toEqual([
      'fillRect',
      'save',
      'beginPath',
      'rect:120,160,840,1030',
      'clip',
      'draw:120,179.8347245409015,840,990.330550918197',
      'restore',
    ])
  })

  it('clips vertically overflowing images to the fixed-sides inset rect when the natural top and bottom padding would be too small', () => {
    const calls: string[] = []

    const context = {
      canvas: { width: 0, height: 0 },
      fillStyle: '',
      filter: 'none',
      save: vi.fn(() => calls.push('save')),
      beginPath: vi.fn(() => calls.push('beginPath')),
      rect: vi.fn((x: number, y: number, width: number, height: number) => {
        calls.push(`rect:${x},${y},${width},${height}`)
      }),
      clip: vi.fn(() => calls.push('clip')),
      fillRect: vi.fn(() => calls.push('fillRect')),
      drawImage: vi.fn((_: unknown, x: number, y: number, width: number, height: number) => {
        calls.push(`draw:${x},${y},${width},${height}`)
      }),
      restore: vi.fn(() => calls.push('restore')),
    } as unknown as CanvasRenderingContext2D

    const image = { width: 3000, height: 4000 } as CanvasImageSource & {
      width: number
      height: number
    }

    drawImageOnCanvas({
      context,
      image,
      targetWidth: 1080,
      targetHeight: 1350,
      backgroundColor: '#ffffff',
      sizingMode: 'fixed-sides',
      borderWidthPixels: 120,
      minVerticalPaddingPixels: 160,
    })

    expect(calls).toEqual([
      'fillRect',
      'save',
      'beginPath',
      'rect:120,160,840,1030',
      'clip',
      'draw:120,115,840,1120',
      'restore',
    ])
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
