import type { ExportFormat, OutputPresetId } from '@/shared/types'

export type ImageSizingMode = 'contain' | 'long-edge' | 'short-edge' | 'border-width' | 'fixed-sides' | 'fill'

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

export const inspectZoomPercents = [50, 100, 200] as const

export type InspectZoom =
  | { mode: 'fit' }
  | { mode: 'percent'; percent: (typeof inspectZoomPercents)[number] }

export type ImageEditRecipe = {
  presetId: OutputPresetId
  backgroundColor: string
  imageSizingMode: ImageSizingMode
  imageEdgePixels: number
  borderWidthPixels: number
  minVerticalPaddingPixels: number
  customWidth: number
  customHeight: number
  filterPresetId: FilterPresetId
}

export type EditHistoryEntry = {
  recipe: ImageEditRecipe
  label: string
  timestamp: number
}

export type ImageHistory = {
  past: EditHistoryEntry[]
  present: EditHistoryEntry
  future: EditHistoryEntry[]
  /** Transient live overlay during a gesture (drag/typing). Never part of history. */
  working?: Partial<ImageEditRecipe>
}

export type EditTimeline = {
  entries: EditHistoryEntry[]
  currentIndex: number
}

export type ExportSettings = {
  outputFormat: ExportFormat
  jpegQuality: number
}

/** @deprecated Use ImageEditRecipe + ExportSettings instead. */
export type BorderSettings = ImageEditRecipe & ExportSettings
