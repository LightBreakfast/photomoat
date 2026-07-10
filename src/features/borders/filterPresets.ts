import type { FilterAdjustments, FilterPresetId } from '@/features/borders/types'
import { filterPresetIds } from '@/features/borders/types'

export type FilterPreset = {
  id: FilterPresetId
  label: string
  adjustments: FilterAdjustments
}

const originalAdjustments: FilterAdjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  grayscale: 0,
  sepia: 0,
  hueRotate: 0,
}

export const filterPresets: FilterPreset[] = [
  {
    id: 'original',
    label: 'Original',
    adjustments: { ...originalAdjustments },
  },
  {
    id: 'drift',
    label: 'Drift',
    adjustments: {
      brightness: 105,
      contrast: 95,
      saturation: 85,
      grayscale: 0,
      sepia: 10,
      hueRotate: 0,
    },
  },
  {
    id: 'ember',
    label: 'Ember',
    adjustments: {
      brightness: 105,
      contrast: 110,
      saturation: 120,
      grayscale: 0,
      sepia: 15,
      hueRotate: -10,
    },
  },
  {
    id: 'coast',
    label: 'Coast',
    adjustments: {
      brightness: 108,
      contrast: 95,
      saturation: 90,
      grayscale: 0,
      sepia: 5,
      hueRotate: 10,
    },
  },
  {
    id: 'muse',
    label: 'Muse',
    adjustments: {
      brightness: 100,
      contrast: 105,
      saturation: 110,
      grayscale: 0,
      sepia: 0,
      hueRotate: -5,
    },
  },
  {
    id: 'noir',
    label: 'Noir',
    adjustments: {
      brightness: 105,
      contrast: 115,
      saturation: 0,
      grayscale: 100,
      sepia: 0,
      hueRotate: 0,
    },
  },
]

export const defaultFilterPresetId: FilterPresetId = 'original'

export function getFilterPresetById(id: FilterPresetId): FilterPreset {
  return filterPresets.find((preset) => preset.id === id) ?? filterPresets[0]
}

export function resolveFilterAdjustments(id: FilterPresetId): FilterAdjustments {
  return getFilterPresetById(id).adjustments
}

const filterPresetIdSet = new Set<string>(filterPresetIds)

export function isFilterPresetId(value: unknown): value is FilterPresetId {
  return typeof value === 'string' && filterPresetIdSet.has(value)
}
