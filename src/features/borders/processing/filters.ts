import type { FilterAdjustments } from '@/features/borders/types'

export function buildCanvasFilter(adjustments: FilterAdjustments): string {
  return [
    `brightness(${adjustments.brightness}%)`,
    `contrast(${adjustments.contrast}%)`,
    `saturate(${adjustments.saturation}%)`,
    `grayscale(${adjustments.grayscale}%)`,
    `sepia(${adjustments.sepia}%)`,
    `hue-rotate(${adjustments.hueRotate}deg)`,
  ].join(' ')
}

export function isNeutralFilter(adjustments: FilterAdjustments): boolean {
  return (
    adjustments.brightness === 100 &&
    adjustments.contrast === 100 &&
    adjustments.saturation === 100 &&
    adjustments.grayscale === 0 &&
    adjustments.sepia === 0 &&
    adjustments.hueRotate === 0
  )
}
