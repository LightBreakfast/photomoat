import {
  defaultCustomHeight,
  defaultCustomWidth,
} from '@/features/borders/constants'
import { defaultFilterPresetId } from '@/features/borders/filterPresets'
import type { ImageEditRecipe } from '@/features/borders/types'

export const defaultImageRecipe: ImageEditRecipe = {
  presetId: 'instagram-portrait',
  backgroundColor: '#ffffff',
  imageSizingMode: 'fixed-sides',
  imageEdgePixels: 900,
  borderWidthPixels: 120,
  minVerticalPaddingPixels: 30,
  customWidth: defaultCustomWidth,
  customHeight: defaultCustomHeight,
  filterPresetId: defaultFilterPresetId,
}
