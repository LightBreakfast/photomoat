import type { ExportFormat, OutputPresetId } from '@/shared/types'

export type ImageSizingMode = 'contain' | 'long-edge' | 'short-edge' | 'border-width' | 'fill'

export const filterPresetIds = ['original', 'drift', 'ember', 'coast', 'muse', 'noir'] as const

export type FilterPresetId = (typeof filterPresetIds)[number]

export type FilterAdjustments = {
  brightness: number
  contrast: number
  saturation: number
  grayscale: number
  sepia: number
  hueRotate: number
}

export type BorderSettings = {
  presetId: OutputPresetId
  backgroundColor: string
  outputFormat: ExportFormat
  jpegQuality: number
  imageSizingMode: ImageSizingMode
  imageEdgePixels: number
  borderWidthPixels: number
  customWidth: number
  customHeight: number
  filterPresetId: FilterPresetId
}
