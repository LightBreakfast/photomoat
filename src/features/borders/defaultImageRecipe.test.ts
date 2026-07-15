import { describe, expect, it } from 'vitest'

import {
  defaultCustomHeight,
  defaultCustomWidth,
} from '@/features/borders/constants'
import { defaultFilterPresetId } from '@/features/borders/filterPresets'
import { defaultImageRecipe } from '@/features/borders/defaultImageRecipe'

describe('defaultImageRecipe', () => {
  it('uses the portrait fixed-sides defaults for new image edits', () => {
    expect(defaultImageRecipe).toEqual({
      presetId: 'instagram-portrait',
      backgroundColor: '#ffffff',
      imageSizingMode: 'fixed-sides',
      imageEdgePixels: 900,
      borderWidthPixels: 120,
      minVerticalPaddingPixels: 30,
      customWidth: defaultCustomWidth,
      customHeight: defaultCustomHeight,
      filterPresetId: defaultFilterPresetId,
    })
  })
})
