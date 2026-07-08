import { describe, expect, it } from 'vitest'

import {
  calculateContainRect,
  calculateImagePlacementRect,
  getPreviewCanvasSize,
} from '@/features/borders/processing/canvasProcessor'

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

  it('reserves a fixed minimum border width when requested', () => {
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

  it('clamps border width to the preset bounds', () => {
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
