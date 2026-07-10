import { describe, expect, it } from 'vitest'

import { customPreset, getPresetById, instagramPresets } from '@/features/borders/presets'

describe('instagramPresets', () => {
  it('includes the expected Instagram sizes', () => {
    expect(instagramPresets).toEqual([
      {
        id: 'instagram-square',
        label: 'Square Post',
        width: 1080,
        height: 1080,
      },
      {
        id: 'instagram-portrait',
        label: 'Portrait Post',
        width: 1080,
        height: 1350,
      },
      {
        id: 'instagram-landscape',
        label: 'Landscape Post',
        width: 1080,
        height: 566,
      },
      {
        id: 'instagram-story',
        label: 'Story / Reel',
        width: 1080,
        height: 1920,
      },
    ])
  })

  it('exposes a default custom preset separately', () => {
    expect(customPreset).toEqual({
      id: 'custom',
      label: 'Custom',
      width: 1080,
      height: 1080,
    })
  })

  it('returns a fallback preset when the id is unknown', () => {
    expect(getPresetById('instagram-square')).toEqual(instagramPresets[0])
  })

  it('returns custom preset with provided dimensions', () => {
    const result = getPresetById('custom', 1920, 1080)
    expect(result).toEqual({
      id: 'custom',
      label: 'Custom',
      width: 1920,
      height: 1080,
    })
  })

  it('returns custom preset with default dimensions when not provided', () => {
    const result = getPresetById('custom')
    expect(result).toEqual({
      id: 'custom',
      label: 'Custom',
      width: 1080,
      height: 1080,
    })
  })
})
