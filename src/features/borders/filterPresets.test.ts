import { describe, expect, it } from 'vitest'

import {
  defaultFilterPresetId,
  filterPresets,
  getFilterPresetById,
  isFilterPresetId,
  resolveFilterAdjustments,
} from '@/features/borders/filterPresets'

describe('filterPresets', () => {
  it('exports a non-empty presets array', () => {
    expect(filterPresets.length).toBeGreaterThan(0)
  })

  it('includes an original preset', () => {
    const original = filterPresets.find((p) => p.id === 'original')
    expect(original).toBeDefined()
    expect(original!.label).toBe('Original')
  })

  it('has unique ids for all presets', () => {
    const ids = filterPresets.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('defaults to original', () => {
    expect(defaultFilterPresetId).toBe('original')
  })
})

describe('getFilterPresetById', () => {
  it('returns matching preset', () => {
    const preset = getFilterPresetById('ember')
    expect(preset.id).toBe('ember')
    expect(preset.label).toBe('Ember')
  })

  it('falls back to original for unknown id', () => {
    const preset = getFilterPresetById('not-real' as ReturnType<typeof getFilterPresetById>['id'])
    expect(preset.id).toBe('original')
  })
})

describe('resolveFilterAdjustments', () => {
  it('returns adjustments for a known preset', () => {
    const adjustments = resolveFilterAdjustments('noir')
    expect(adjustments).toHaveProperty('brightness')
    expect(adjustments).toHaveProperty('contrast')
    expect(adjustments).toHaveProperty('saturation')
    expect(adjustments).toHaveProperty('grayscale')
    expect(adjustments).toHaveProperty('sepia')
    expect(adjustments).toHaveProperty('hueRotate')
  })

  it('returns neutral adjustments for original', () => {
    const adjustments = resolveFilterAdjustments('original')
    expect(adjustments).toEqual({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      grayscale: 0,
      sepia: 0,
      hueRotate: 0,
    })
  })
})

describe('isFilterPresetId', () => {
  it('returns true for known ids', () => {
    expect(isFilterPresetId('ember')).toBe(true)
    expect(isFilterPresetId('original')).toBe(true)
  })

  it('returns false for unknown ids', () => {
    expect(isFilterPresetId('not-real')).toBe(false)
    expect(isFilterPresetId(undefined)).toBe(false)
  })
})
