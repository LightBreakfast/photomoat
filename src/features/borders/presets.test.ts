import { describe, expect, it } from 'vitest'

import { getPresetById, instagramPresets } from '@/features/borders/presets'

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

  it('returns a fallback preset when the id is unknown', () => {
    expect(getPresetById('instagram-square')).toEqual(instagramPresets[0])
  })
})
