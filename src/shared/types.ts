export type ImageMimeType = 'image/jpeg' | 'image/png'

export type OutputPresetId =
  | 'instagram-square'
  | 'instagram-portrait'
  | 'instagram-landscape'
  | 'instagram-story'
  | 'custom'

export type OutputPreset = {
  id: OutputPresetId
  label: string
  width: number
  height: number
}

export type ExportFormat = 'image/png' | 'image/jpeg'

export type ImageQueueStatus = 'pending' | 'ready' | 'processing' | 'error'

export type ImageQueueItem = {
  id: string
  file: File
  objectUrl: string
  filename: string
  mimeType: ImageMimeType
  originalWidth?: number
  originalHeight?: number
  status: ImageQueueStatus
  error?: string
}

export type ImageDimensions = {
  width: number
  height: number
}
