import {
  inspectZoomPercents,
  type EditHistoryEntry,
  type ImageEditRecipe,
  type ImageSizingMode,
  type InspectZoom,
} from '@/features/borders/types'
import { customSizeMax, customSizeMin } from '@/features/borders/constants'
import { defaultImageRecipe } from '@/features/borders/defaultImageRecipe'
import { isFilterPresetId } from '@/features/borders/filterPresets'
import { instagramPresets } from '@/features/borders/presets'
import { getDB } from '@/shared/storage/db'
import {
  SESSION_SCHEMA_VERSION,
  WORKING_CATALOG_ID,
  type PersistedImageHistory,
  type PersistedQueueItem,
  type PersistedSession,
  type PersistedUiState,
} from '@/shared/storage/types'

const SESSION_KEY = 'session'

const presetIds = new Set<string>(['custom', ...instagramPresets.map((preset) => preset.id)])
const imageSizingModes = new Set<ImageSizingMode>([
  'contain',
  'long-edge',
  'short-edge',
  'border-width',
  'fixed-sides',
  'fill',
])

const HEX_COLOR = /^#[0-9a-f]{6}$/i

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

function sanitizeRecipe(value: unknown): ImageEditRecipe | null {
  if (!isRecord(value)) {
    return null
  }

  const recipe: ImageEditRecipe = { ...defaultImageRecipe }

  if (typeof value.presetId === 'string' && presetIds.has(value.presetId)) {
    recipe.presetId = value.presetId as ImageEditRecipe['presetId']
  }
  if (typeof value.backgroundColor === 'string' && HEX_COLOR.test(value.backgroundColor)) {
    recipe.backgroundColor = value.backgroundColor
  }
  if (typeof value.imageSizingMode === 'string' && imageSizingModes.has(value.imageSizingMode as ImageSizingMode)) {
    recipe.imageSizingMode = value.imageSizingMode as ImageSizingMode
  }

  const sanitizePositiveInteger = (raw: unknown, fallback: number) =>
    typeof raw === 'number' && Number.isFinite(raw) ? Math.max(1, Math.round(raw)) : fallback
  const sanitizePositiveIntegerInRange = (raw: unknown, fallback: number, min: number, max: number) =>
    typeof raw === 'number' && Number.isFinite(raw)
      ? Math.min(max, Math.max(min, Math.round(raw)))
      : fallback

  recipe.imageEdgePixels = sanitizePositiveInteger(value.imageEdgePixels, recipe.imageEdgePixels)
  recipe.borderWidthPixels = sanitizePositiveInteger(value.borderWidthPixels, recipe.borderWidthPixels)
  recipe.minVerticalPaddingPixels = sanitizePositiveInteger(
    value.minVerticalPaddingPixels,
    recipe.minVerticalPaddingPixels,
  )
  recipe.customWidth = sanitizePositiveIntegerInRange(
    value.customWidth,
    recipe.customWidth,
    customSizeMin,
    customSizeMax,
  )
  recipe.customHeight = sanitizePositiveIntegerInRange(
    value.customHeight,
    recipe.customHeight,
    customSizeMin,
    customSizeMax,
  )

  if (isFilterPresetId(value.filterPresetId)) {
    recipe.filterPresetId = value.filterPresetId
  }
  if (typeof value.rotationDegrees === 'number' && Number.isFinite(value.rotationDegrees)) {
    recipe.rotationDegrees = value.rotationDegrees
  }
  if (typeof value.flipHorizontal === 'boolean') {
    recipe.flipHorizontal = value.flipHorizontal
  }
  if (typeof value.flipVertical === 'boolean') {
    recipe.flipVertical = value.flipVertical
  }

  return recipe
}

function sanitizeEditHistoryEntry(value: unknown): EditHistoryEntry | null {
  if (!isRecord(value)) {
    return null
  }
  if (typeof value.label !== 'string') {
    return null
  }
  if (typeof value.timestamp !== 'number' || !Number.isFinite(value.timestamp)) {
    return null
  }
  const recipe = sanitizeRecipe(value.recipe)
  if (!recipe) {
    return null
  }
  return { recipe, label: value.label, timestamp: value.timestamp }
}

function sanitizeEditHistory(value: unknown): PersistedImageHistory | null {
  if (!isRecord(value) || !Array.isArray(value.past) || !Array.isArray(value.future)) {
    return null
  }

  const present = sanitizeEditHistoryEntry(value.present)
  if (!present) {
    return null
  }

  return {
    past: value.past
      .map(sanitizeEditHistoryEntry)
      .filter((entry): entry is EditHistoryEntry => entry !== null),
    present,
    future: value.future
      .map(sanitizeEditHistoryEntry)
      .filter((entry): entry is EditHistoryEntry => entry !== null),
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

export async function loadSession(): Promise<PersistedSession | null> {
  const db = getDB()
  if (!db) {
    return null
  }
  const connection = await db
  if (!connection) {
    return null
  }

  const tx = connection.transaction(['kv', 'files'], 'readwrite')
  const raw = await tx.objectStore('kv').get(SESSION_KEY)
  if (raw === undefined) {
    await tx.done
    return null
  }

  const session = sanitizePersistedSession(raw)

  if (!session) {
    await tx.objectStore('kv').delete(SESSION_KEY)
    const byCatalog = tx.objectStore('files').index('by-catalog')
    let cursor = await byCatalog.openCursor(WORKING_CATALOG_ID)
    while (cursor) {
      await cursor.delete()
      cursor = await cursor.continue()
    }
  }

  await tx.done
  return session
}

export async function saveSession(session: PersistedSession): Promise<boolean> {
  try {
    const db = getDB()
    if (!db) {
      return false
    }
    const connection = await db
    if (!connection) {
      return false
    }
    await connection.put('kv', session, SESSION_KEY)
    return true
  } catch {
    return false
  }
}

export async function clearSession(): Promise<boolean> {
  try {
    const db = getDB()
    if (!db) {
      return false
    }
    const connection = await db
    if (!connection) {
      return false
    }
    await connection.delete('kv', SESSION_KEY)
    return true
  } catch {
    return false
  }
}
