import { describe, expect, it } from 'vitest'

import { defaultImageRecipe } from '@/features/borders/defaultImageRecipe'
import { describeChange, describeRecipe } from '@/features/borders/historyLabels'

describe('describeChange', () => {
  it('labels a preset change', () => {
    expect(describeChange({ presetId: 'instagram-portrait' })).toBe('Preset: Portrait Post')
  })

  it('labels a filter change', () => {
    expect(describeChange({ filterPresetId: 'ember' })).toBe('Filter: Ember')
  })

  it('labels a background change', () => {
    expect(describeChange({ backgroundColor: '#000000' })).toBe('Background: #000000')
  })

  it('labels a sizing mode change', () => {
    expect(describeChange({ imageSizingMode: 'fill' })).toBe('Sizing: Fill (no border)')
  })

  it('labels edge and border pixel changes', () => {
    expect(describeChange({ imageEdgePixels: 920 })).toBe('Edge size: 920px')
    expect(describeChange({ borderWidthPixels: 120 })).toBe('Border width: 120px')
    expect(describeChange({ minVerticalPaddingPixels: 60 })).toBe('Vertical min: 60px')
  })

  it('labels the fixed-sides sizing mode', () => {
    expect(describeChange({ imageSizingMode: 'fixed-sides' })).toBe('Sizing: Fixed sides')
    expect(describeChange({ imageSizingMode: 'border-width' })).toBe('Sizing: Side padding')
  })

  it('labels custom dimension changes', () => {
    expect(describeChange({ customWidth: 1200 })).toBe('Width: 1200px')
    expect(describeChange({ customHeight: 1500 })).toBe('Height: 1500px')
  })

  it('joins multi-field patches', () => {
    expect(describeChange({ filterPresetId: 'noir', backgroundColor: '#111111' })).toBe(
      'Filter: Noir · Background: #111111',
    )
  })

  it('falls back for empty patches', () => {
    expect(describeChange({})).toBe('Edit')
  })
})

describe('describeRecipe', () => {
  it('labels a recipe by its preset', () => {
    expect(describeRecipe(defaultImageRecipe)).toBe('Preset: Portrait Post')
  })

  it('includes the filter when non-original', () => {
    expect(describeRecipe({ ...defaultImageRecipe, filterPresetId: 'drift' })).toBe(
      'Preset: Portrait Post · Filter: Drift',
    )
  })

  it('resolves custom preset dimensions', () => {
    expect(
      describeRecipe({ ...defaultImageRecipe, presetId: 'custom', customWidth: 800, customHeight: 600 }),
    ).toBe('Preset: Custom')
  })
})
