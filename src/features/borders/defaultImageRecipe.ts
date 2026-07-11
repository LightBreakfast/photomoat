import {
  defaultCustomHeight,
  defaultCustomWidth,
} from '@/features/borders/constants'
import { defaultFilterPresetId } from '@/features/borders/filterPresets'
import type { ImageEditRecipe } from '@/features/borders/types'

export const defaultImageRecipe: ImageEditRecipe = {
  presetId: 'instagram-square',
  backgroundColor: '#ffffff',
  imageSizingMode: 'contain',
  imageEdgePixels: 900,
  borderWidthPixels: 90,
  minVerticalPaddingPixels: 90,
  customWidth: defaultCustomWidth,
  customHeight: defaultCustomHeight,
  filterPresetId: defaultFilterPresetId,
}
