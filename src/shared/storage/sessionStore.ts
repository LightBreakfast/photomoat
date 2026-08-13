import {
  inspectZoomPercents,
  type EditHistoryEntry,
  type InspectZoom,
} from '@/features/borders/types'
import { getDB } from '@/shared/storage/db'
import {
  SESSION_SCHEMA_VERSION,
  type PersistedImageHistory,
  type PersistedQueueItem,
  type PersistedSession,
  type PersistedUiState,
} from '@/shared/storage/types'

const SESSION_KEY = 'session'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function sanitizeQueueItem(value: unknown): PersistedQueueItem | null {
  if (!isRecord(value)) {
    return null
  }

  const { id, filename, mimeType, status } = value
  if (typeof id !== 'string' || id.length === 0) {
    return null
  }
  if (typeof filename !== 'string' || filename.length === 0) {
    return null
  }
  if (mimeType !== 'image/jpeg' && mimeType !== 'image/png') {
    return null
  }
  if (status !== 'ready' && status !== 'error') {
    return null
  }

  const item: PersistedQueueItem = { id, filename, mimeType, status }

  if (
    typeof value.originalWidth === 'number' &&
    Number.isFinite(value.originalWidth) &&
    value.originalWidth > 0
  ) {
    item.originalWidth = value.originalWidth
  }
  if (
    typeof value.originalHeight === 'number' &&
    Number.isFinite(value.originalHeight) &&
    value.originalHeight > 0
  ) {
    item.originalHeight = value.originalHeight
  }
  if (typeof value.error === 'string' && value.error.length > 0) {
    item.error = value.error
  }

  return item
}

function isEditHistoryEntry(value: unknown): value is EditHistoryEntry {
  if (!isRecord(value)) {
    return false
  }
  return (
    isRecord(value.recipe) &&
    typeof value.label === 'string' &&
    typeof value.timestamp === 'number' &&
    Number.isFinite(value.timestamp)
  )
}

function sanitizeEditHistory(value: unknown): PersistedImageHistory | null {
  if (!isRecord(value) || !Array.isArray(value.past) || !Array.isArray(value.future)) {
    return null
  }

  const present = value.present
  if (!isEditHistoryEntry(present)) {
    return null
  }

  return {
    past: value.past.filter(isEditHistoryEntry),
    present,
    future: value.future.filter(isEditHistoryEntry),
  }
}

function sanitizeInspectZoom(value: unknown): InspectZoom {
  if (
    isRecord(value) &&
    value.mode === 'percent' &&
    typeof value.percent === 'number' &&
    (inspectZoomPercents as readonly number[]).includes(value.percent)
  ) {
    return { mode: 'percent', percent: value.percent as (typeof inspectZoomPercents)[number] }
  }
  return { mode: 'fit' }
}

function sanitizeUi(value: unknown, itemIds: string[]): PersistedUiState | null {
  if (!isRecord(value)) {
    return null
  }

  const workspaceMode =
    value.workspaceMode === 'inspect'
      ? 'inspect'
      : value.workspaceMode === 'browse'
        ? 'browse'
        : 'browse'

  const idSet = new Set(itemIds)
  const activeItemId =
    typeof value.activeItemId === 'string' && idSet.has(value.activeItemId)
      ? value.activeItemId
      : null

  const selectedIds = Array.isArray(value.selectedIds)
    ? value.selectedIds.filter((id): id is string => typeof id === 'string' && idSet.has(id))
    : []

  const columns =
    typeof value.columns === 'number' && Number.isFinite(value.columns)
      ? Math.min(6, Math.max(1, Math.round(value.columns)))
      : 3

  return {
    workspaceMode,
    activeItemId,
    selectedIds,
    inspectZoom: sanitizeInspectZoom(value.inspectZoom),
    columns,
  }
}

/**
 * Validate + normalize an unknown stored value into a usable session.
 * Returns `null` for anything that isn't a session for this schema version.
 */
export function sanitizePersistedSession(value: unknown): PersistedSession | null {
  if (!isRecord(value) || value.schemaVersion !== SESSION_SCHEMA_VERSION) {
    return null
  }
  if (!Array.isArray(value.items) || !isRecord(value.edits)) {
    return null
  }

  const items: PersistedQueueItem[] = []
  for (const rawItem of value.items) {
    const item = sanitizeQueueItem(rawItem)
    if (item) {
      items.push(item)
    }
  }

  const itemIds = new Set(items.map((item) => item.id))
  const edits: Record<string, PersistedImageHistory> = {}
  for (const [id, rawHistory] of Object.entries(value.edits)) {
    if (!itemIds.has(id)) {
      continue
    }
    const history = sanitizeEditHistory(rawHistory)
    if (history) {
      edits[id] = history
    }
  }

  const ui = sanitizeUi(value.ui, items.map((item) => item.id))
  if (!ui) {
    return null
  }

  const savedAt =
    typeof value.savedAt === 'number' && Number.isFinite(value.savedAt) ? value.savedAt : Date.now()

  return { schemaVersion: SESSION_SCHEMA_VERSION, savedAt, items, edits, ui }
}

/** Load the stored working session, or `null` when absent/invalid. */
export async function loadSession(): Promise<PersistedSession | null> {
  const db = getDB()
  if (!db) {
    return null
  }

  const raw = await (await db).get('kv', SESSION_KEY)
  const session = sanitizePersistedSession(raw)

  if (!session) {
    // Invalid/unknown shape — discard rather than fail (v1 policy).
    await clearSession()
  }

  return session
}

export async function saveSession(session: PersistedSession): Promise<void> {
  const db = getDB()
  if (!db) {
    return
  }
  await (await db).put('kv', session, SESSION_KEY)
}

export async function clearSession(): Promise<void> {
  const db = getDB()
  if (!db) {
    return
  }
  await (await db).delete('kv', SESSION_KEY)
}
