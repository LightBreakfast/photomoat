import type { EditHistoryEntry, InspectZoom } from '@/features/borders/types'
import type { ImageMimeType } from '@/shared/types'

/**
 * Bump when the persisted session shape changes incompatibly. v1 policy:
 * on mismatch, stored data is discarded (no migration).
 */
export const SESSION_SCHEMA_VERSION = 1

/** Single auto-saved session catalog. Reserved for tier-2 named catalogs. */
export const WORKING_CATALOG_ID = 'working'

/**
 * Persisted image bytes + metadata. The `File` object is never stored
 * directly (Safari returns name-less Blobs on read, and structured-clone
 * environments can mangle File/Blob); the bytes are stored as an
 * `ArrayBuffer` with name/type/lastModified as separate fields, and an
 * identical `File` is rebuilt on restore.
 */
export type PersistedFileRecord = {
  id: string
  catalogId: string
  /** Raw file bytes (not a Blob — clones reliably in every environment). */
  bytes: ArrayBuffer
  name: string
  type: string
  lastModified: number
}

/**
 * Serialisable subset of `ImageQueueItem` — no `File`, no `objectUrl`
 * (both are reconstructed on restore). Status is normalized: `pending` and
 * `processing` are never persisted.
 */
export type PersistedQueueItem = {
  id: string
  filename: string
  mimeType: ImageMimeType
  originalWidth?: number
  originalHeight?: number
  status: 'ready' | 'error'
  error?: string
}

/** Per-image undo/redo history, minus the transient `working` overlay. */
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
