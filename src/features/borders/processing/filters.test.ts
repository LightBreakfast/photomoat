import { describe, expect, it } from 'vitest'

import { resolveFilterAdjustments } from '@/features/borders/filterPresets'
import { buildCanvasFilter, isNeutralFilter } from '@/features/borders/processing/filters'

describe('buildCanvasFilter', () => {
  it('returns correct CSS filter string', () => {
    const result = buildCanvasFilter({
      brightness: 105,
      contrast: 110,
      saturation: 120,
      grayscale: 0,
      sepia: 15,
      hueRotate: -10,
    })

    expect(result).toBe(
      'brightness(105%) contrast(110%) saturate(120%) grayscale(0%) sepia(15%) hue-rotate(-10deg)',
    )
  })

  it('returns neutral filter string for original adjustments', () => {
    const result = buildCanvasFilter(resolveFilterAdjustments('original'))

    expect(result).toBe(
      'brightness(100%) contrast(100%) saturate(100%) grayscale(0%) sepia(0%) hue-rotate(0deg)',
    )
  })
})

describe('isNeutralFilter', () => {
  it('returns true for original adjustments', () => {
    expect(isNeutralFilter(resolveFilterAdjustments('original'))).toBe(true)
  })

  it('returns false for non-original adjustments', () => {
    expect(isNeutralFilter(resolveFilterAdjustments('ember'))).toBe(false)
  })

  it('returns false when only one value differs', () => {
    expect(
      isNeutralFilter({
        brightness: 101,
        contrast: 100,
        saturation: 100,
        grayscale: 0,
        sepia: 0,
        hueRotate: 0,
      }),
    ).toBe(false)
  })
})
