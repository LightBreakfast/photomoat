import type { ExportFormat, OutputPresetId } from '@/shared/types'

export type ImageSizingMode = 'contain' | 'long-edge' | 'short-edge' | 'border-width' | 'fill'

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
}
