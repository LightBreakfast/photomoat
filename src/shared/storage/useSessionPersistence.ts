import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react'

import type { ImageHistory } from '@/features/borders/types'
import { clearFiles } from '@/shared/storage/fileStore'
import { getStorageUsage, requestPersistence, type StorageUsage } from '@/shared/storage/quota'
import { clearSession, loadSession, saveSession } from '@/shared/storage/sessionStore'
import {
  SESSION_SCHEMA_VERSION,
  type PersistedImageHistory,
  type PersistedQueueItem,
  type PersistedSession,
  type PersistedUiState,
} from '@/shared/storage/types'
import type { ImageQueueItem } from '@/shared/types'

const SAVE_DEBOUNCE_MS = 400

export type PersistenceStatus =
  | { status: 'idle' }
  | { status: 'offer-restore'; session: PersistedSession }
  | { status: 'active' }

type UseSessionPersistenceOptions = {
  items: ImageQueueItem[]
  recipesById: Record<string, ImageHistory>
  /** Latest UI session state (BorderToolPage keeps this fresh each render). */
  uiStateRef: MutableRefObject<PersistedUiState>
  /** Hydrate queue + edit state + UI from a stored session. Called once. */
  onRestore: (session: PersistedSession) => Promise<void>
}

function serializeItems(items: ImageQueueItem[]): PersistedQueueItem[] {
  return items.map((item) => {
    const record: PersistedQueueItem = {
      id: item.id,
      filename: item.filename,
      mimeType: item.mimeType,
      // 'pending' / 'processing' are transient; on restore the item is 'ready'
      // (dimensions are recomputed when missing) unless it was an error.
      status: item.status === 'error' ? 'error' : 'ready',
    }
    if (item.originalWidth !== undefined) {
      record.originalWidth = item.originalWidth
    }
    if (item.originalHeight !== undefined) {
      record.originalHeight = item.originalHeight
    }
    if (item.error) {
      record.error = item.error
    }
    return record
  })
}

/** Drop the transient `working` overlay — it is never persisted. */
function serializeEdits(byId: Record<string, ImageHistory>): Record<string, PersistedImageHistory> {
  const edits: Record<string, PersistedImageHistory> = {}
  for (const [id, history] of Object.entries(byId)) {
    edits[id] = {
      past: history.past,
      present: history.present,
      future: history.future,
    }
  }
  return edits
}

function buildSession(
  items: ImageQueueItem[],
  recipesById: Record<string, ImageHistory>,
  ui: PersistedUiState,
): PersistedSession {
  return {
    schemaVersion: SESSION_SCHEMA_VERSION,
    savedAt: Date.now(),
    items: serializeItems(items),
    edits: serializeEdits(recipesById),
    ui,
  }
}

/**
 * Owns the save/restore lifecycle for the single working session.
 *
 * State machine:
 * - `idle`            nothing stored (or the user dismissed an offer); no saving
 * - `offer-restore`   a stored session exists; banner is shown; no saving
 * - `active`          session restored or a fresh one started; debounced saving
 *
 * Saving only ever happens in `active`. The first image added outside
 * `active` starts a fresh session, clearing any stale stored data first.
 */
export function useSessionPersistence({
  items,
  recipesById,
  uiStateRef,
  onRestore,
}: UseSessionPersistenceOptions) {
  const [status, setStatus] = useState<PersistenceStatus>({ status: 'idle' })
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null)

  const storedSessionExistsRef = useRef(false)
  // Track the empty→non-empty transition: only the first add (from an empty
  // queue) outside `active` starts a fresh session. After the queue empties
  // again, the next add re-triggers.
  const wasEmptyRef = useRef(true)

  // Look for a stored session once on mount.
  useEffect(() => {
    let cancelled = false
    void loadSession().then((session) => {
      if (cancelled) {
        return
      }
      if (session) {
        storedSessionExistsRef.current = true
        setStatus({ status: 'offer-restore', session })
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    void getStorageUsage().then(setStorageUsage)
  }, [])

  const acceptRestore = useCallback(async () => {
    if (status.status !== 'offer-restore') {
      return
    }
    try {
      await onRestore(status.session)
    } catch {
      // Stay on the offer so the user can retry or dismiss.
      return
    }
    storedSessionExistsRef.current = false
    setStatus({ status: 'active' })
    void requestPersistence()
  }, [status, onRestore])

  const dismiss = useCallback(() => {
    if (status.status !== 'offer-restore') {
      return
    }
    // Keep the stored data for a future visit; disable saving this visit.
    setStatus({ status: 'idle' })
  }, [status])

  const startFresh = useCallback(async () => {
    await clearSession()
    await clearFiles()
    storedSessionExistsRef.current = false
    setStatus({ status: 'active' })
    void requestPersistence()
  }, [])

  const clearLibrary = useCallback(async () => {
    await clearSession()
    await clearFiles()
    storedSessionExistsRef.current = false
    setStatus({ status: 'idle' })
  }, [])

  // Adding the first image outside `active` starts a fresh session. If a
  // stored session was declined (dismiss) or never answered, it is stale by
  // definition now — clear it before saving the new work.
  useEffect(() => {
    if (status.status === 'active') {
      return
    }
    if (items.length > 0 && wasEmptyRef.current) {
      wasEmptyRef.current = false
      if (storedSessionExistsRef.current) {
        void clearSession()
        void clearFiles()
      }
      setStatus({ status: 'active' })
      void requestPersistence()
    } else if (items.length === 0) {
      wasEmptyRef.current = true
    }
  }, [items.length, status.status])

  // Debounced session-doc write while active.
  useEffect(() => {
    if (status.status !== 'active') {
      return
    }
    const timer = window.setTimeout(() => {
      void writeSession(items, recipesById, uiStateRef.current)
    }, SAVE_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [status.status, items, recipesById, uiStateRef])

  // Best-effort final flush when the page is hidden or being unloaded.
  useEffect(() => {
    if (status.status !== 'active') {
      return
    }
    const flush = () => {
      void writeSession(items, recipesById, uiStateRef.current)
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flush()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pagehide', flush)
    }
  }, [status.status, items, recipesById, uiStateRef])

  return {
    status,
    storageUsage,
    acceptRestore,
    dismiss,
    startFresh,
    clearLibrary,
  }
}

async function writeSession(
  items: ImageQueueItem[],
  recipesById: Record<string, ImageHistory>,
  ui: PersistedUiState,
): Promise<void> {
  if (items.length === 0) {
    // An empty library is "no session" — don't offer a restore of nothing.
    await clearSession()
    return
  }
  await saveSession(buildSession(items, recipesById, ui))
}
