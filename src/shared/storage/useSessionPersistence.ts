import { useCallback, useEffect, useRef, useState } from 'react'

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
  /**
   * Latest UI session state. Passed by value so a UI-only change (workspace
   * mode, active image, selection, zoom, columns) re-schedules the debounced
   * save even when the queue and recipes are unchanged. Callers should memoize
   * this so unrelated re-renders don't reset the debounce.
   */
  uiState: PersistedUiState
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
 * `active` starts a fresh session, clearing any stale stored data first. The
 * initial session lookup and the first add are coordinated so a slow lookup
 * can never resurrect a restore offer over work the user already started.
 */
export function useSessionPersistence({
  items,
  recipesById,
  uiState,
  onRestore,
}: UseSessionPersistenceOptions) {
  const [status, setStatus] = useState<PersistenceStatus>({ status: 'idle' })
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)

  const storedSessionExistsRef = useRef(false)
  // Synchronous guard so a second Restore trigger while one is in flight
  // (e.g. a double-click) is rejected before any async work starts.
  const restoringRef = useRef(false)
  // Set synchronously when the user's first add happens, before the initial
  // lookup settles — the lookup must not override work the user started.
  const userStartedRef = useRef(false)
  // Resolves when the mount-time lookup has settled (success or failure).
  const initialLoadRef = useRef<Promise<void> | null>(null)
  // Track the empty→non-empty transition: only the first add (from an empty
  // queue) outside `active` starts a fresh session. After the queue empties
  // again, the next add re-triggers.
  const wasEmptyRef = useRef(true)

  // Look for a stored session once on mount.
  useEffect(() => {
    let cancelled = false
    initialLoadRef.current = loadSession()
      .then((session) => {
        if (cancelled) {
          return
        }
        if (!session) {
          return
        }
        storedSessionExistsRef.current = true
        if (userStartedRef.current) {
          // The user already started fresh work before the lookup settled;
          // the auto-start effect clears this stale data. Don't offer it.
          return
        }
        setStatus({ status: 'offer-restore', session })
      })
      .catch(() => {
        // Storage unavailable — continue in-memory; no restore offer.
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    void getStorageUsage().then(setStorageUsage)
  }, [])

  const acceptRestore = useCallback(async () => {
    if (status.status !== 'offer-restore' || restoringRef.current) {
      return
    }
    restoringRef.current = true
    setIsRestoring(true)
    try {
      await onRestore(status.session)
      storedSessionExistsRef.current = false
      setStatus({ status: 'active' })
      void requestPersistence()
    } catch {
      // Stay on the offer so the user can retry or dismiss.
    } finally {
      restoringRef.current = false
      setIsRestoring(false)
    }
  }, [status, onRestore])

  const dismiss = useCallback(() => {
    if (status.status !== 'offer-restore') {
      return
    }
    // Keep the stored data for a future visit; disable saving this visit.
    setStatus({ status: 'idle' })
  }, [status])

  const startFresh = useCallback(async () => {
    try {
      await clearSession()
      await clearFiles()
    } catch {
      // Storage unavailable — continue in-memory; never block the add.
    }
    storedSessionExistsRef.current = false
    setStatus({ status: 'active' })
    void requestPersistence()
  }, [])

  const clearLibrary = useCallback(async () => {
    try {
      await clearSession()
      await clearFiles()
    } catch {
      // Storage unavailable — the in-memory session remains usable.
    }
    storedSessionExistsRef.current = false
    setStatus({ status: 'idle' })
  }, [])

  // Adding the first image outside `active` starts a fresh session. If a
  // stored session was declined (dismiss) or never answered, it is stale by
  // definition now — clear it before saving the new work. The clear waits for
  // the initial lookup so a race can't leave stale data behind.
  useEffect(() => {
    if (status.status === 'active') {
      return
    }
    if (items.length > 0 && wasEmptyRef.current) {
      wasEmptyRef.current = false
      userStartedRef.current = true
      void (initialLoadRef.current ?? Promise.resolve()).then(() => {
        if (storedSessionExistsRef.current) {
          storedSessionExistsRef.current = false
          void clearSession().catch(() => {})
          void clearFiles().catch(() => {})
        }
        setStatus({ status: 'active' })
        void requestPersistence()
      })
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
      void writeSession(items, recipesById, uiState)
    }, SAVE_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [status.status, items, recipesById, uiState])

  // Best-effort final flush when the page is hidden or being unloaded.
  useEffect(() => {
    if (status.status !== 'active') {
      return
    }
    const flush = () => {
      void writeSession(items, recipesById, uiState)
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
  }, [status.status, items, recipesById, uiState])

  return {
    status,
    storageUsage,
    isRestoring,
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
  try {
    if (items.length === 0) {
      // An empty library is "no session" — don't offer a restore of nothing.
      await clearSession()
      return
    }
    await saveSession(buildSession(items, recipesById, ui))
  } catch {
    // Best-effort persistence: the app keeps working in memory.
  }
}
