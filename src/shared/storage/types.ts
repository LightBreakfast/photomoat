import type { EditHistoryEntry, InspectZoom } from '@/features/borders/types'
import type { ImageMimeType } from '@/shared/types'

export const SESSION_SCHEMA_VERSION = 1

export const WORKING_CATALOG_ID = 'working'

export type PersistedFileRecord = {
  id: string
  catalogId: string
  bytes: ArrayBuffer
  name: string
  type: string
  lastModified: number
}

export type PersistedQueueItem = {
  id: string
  filename: string
  mimeType: ImageMimeType
  originalWidth?: number
  originalHeight?: number
  status: 'ready' | 'error'
  error?: string
}

export type PersistedImageHistory = {
  past: EditHistoryEntry[]
  present: EditHistoryEntry
  future: EditHistoryEntry[]
}

export type PersistedUiState = {
  workspaceMode: 'browse' | 'inspect'
  activeItemId: string | null
  selectedIds: string[]
  inspectZoom: InspectZoom
  columns: number
}

export type PersistedSession = {
  schemaVersion: typeof SESSION_SCHEMA_VERSION
  savedAt: number
  items: PersistedQueueItem[]
  edits: Record<string, PersistedImageHistory>
  ui: PersistedUiState
}
