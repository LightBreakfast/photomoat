import { getFilterPresetById } from '@/features/borders/filterPresets'
import { getPresetById } from '@/features/borders/presets'
import type { ImageEditRecipe } from '@/features/borders/types'

const sizingLabels: Record<ImageEditRecipe['imageSizingMode'], string> = {
  contain: 'Auto fit',
  'long-edge': 'Long edge',
  'short-edge': 'Short edge',
  'border-width': 'Side padding',
  'fixed-sides': 'Fixed sides',
  fill: 'Fill (no border)',
}

/**
 * Human-readable label for a patch applied to a recipe, e.g. "Filter: Ember".
 * Uses final values only, so it stays pure (no base recipe needed).
 */
export function describeChange(patch: Partial<ImageEditRecipe>): string {
  const parts: string[] = []

  if (patch.presetId !== undefined) {
    parts.push(`Preset: ${getPresetById(patch.presetId).label}`)
  }
  if (patch.filterPresetId !== undefined) {
    parts.push(`Filter: ${getFilterPresetById(patch.filterPresetId).label}`)
  }
  if (patch.backgroundColor !== undefined) {
    parts.push(`Background: ${patch.backgroundColor}`)
  }
  if (patch.imageSizingMode !== undefined) {
    parts.push(`Sizing: ${sizingLabels[patch.imageSizingMode]}`)
  }
  if (patch.imageEdgePixels !== undefined) {
    parts.push(`Edge size: ${patch.imageEdgePixels}px`)
  }
  if (patch.borderWidthPixels !== undefined) {
    parts.push(`Border width: ${patch.borderWidthPixels}px`)
  }
  if (patch.minVerticalPaddingPixels !== undefined) {
    parts.push(`Vertical min: ${patch.minVerticalPaddingPixels}px`)
  }
  if (patch.customWidth !== undefined) {
    parts.push(`Width: ${patch.customWidth}px`)
  }
  if (patch.customHeight !== undefined) {
    parts.push(`Height: ${patch.customHeight}px`)
  }

  return parts.length > 0 ? parts.join(' · ') : 'Edit'
}

/**
 * Human-readable label for a full recipe replacement (batch apply / copy).
 */
export function describeRecipe(recipe: ImageEditRecipe): string {
  const preset = getPresetById(recipe.presetId, recipe.customWidth, recipe.customHeight)
  const parts = [`Preset: ${preset.label}`]
  if (recipe.filterPresetId !== 'original') {
    parts.push(`Filter: ${getFilterPresetById(recipe.filterPresetId).label}`)
  }
  return parts.join(' · ')
}
