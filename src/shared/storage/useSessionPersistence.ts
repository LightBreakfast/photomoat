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
  uiState: PersistedUiState
  onRestore: (session: PersistedSession) => Promise<void>
}

function serializeItems(items: ImageQueueItem[]): PersistedQueueItem[] {
  return items.filter((item) => item.persisted !== false).map((item) => {
    const record: PersistedQueueItem = {
      id: item.id,
      filename: item.filename,
      mimeType: item.mimeType,
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

function serializeEdits(
  byId: Record<string, ImageHistory>,
  itemIds: ReadonlySet<string>,
): Record<string, PersistedImageHistory> {
  const edits: Record<string, PersistedImageHistory> = {}
  for (const [id, history] of Object.entries(byId)) {
    if (!itemIds.has(id)) {
      continue
    }
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
  const persistedItems = serializeItems(items)
  const itemIds = new Set(persistedItems.map((item) => item.id))
  return {
    schemaVersion: SESSION_SCHEMA_VERSION,
    savedAt: Date.now(),
    items: persistedItems,
    edits: serializeEdits(recipesById, itemIds),
    ui,
  }
}

export function useSessionPersistence({
  items,
  recipesById,
  uiState,
  onRestore,
}: UseSessionPersistenceOptions) {
  const [status, setStatus] = useState<PersistenceStatus>({ status: 'idle' })
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)
  const [persistenceWarning, setPersistenceWarning] = useState<string | null>(null)

  const storedSessionExistsRef = useRef(false)
  const restoringRef = useRef(false)
  const userStartedRef = useRef(false)
  const initialLoadRef = useRef<Promise<void> | null>(null)
  const wasEmptyRef = useRef(true)

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
          return
        }
        setStatus({ status: 'offer-restore', session })
      })
      .catch(() => {})
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
    } catch {} finally {
      restoringRef.current = false
      setIsRestoring(false)
    }
  }, [status, onRestore])

  const dismiss = useCallback(() => {
    if (status.status !== 'offer-restore') {
      return
    }
    setStatus({ status: 'idle' })
  }, [status])

  const startFresh = useCallback(async () => {
    userStartedRef.current = true
    await (initialLoadRef.current ?? Promise.resolve())

    const [sessionCleared, filesCleared] = await Promise.all([clearSession(), clearFiles()])
    if (!sessionCleared || !filesCleared) {
      setPersistenceWarning('Session saving is unavailable; your work will not survive refresh.')
    }
    storedSessionExistsRef.current = false
    setStatus({ status: 'active' })
    void requestPersistence()
  }, [])

  const clearLibrary = useCallback(async () => {
    const [sessionCleared, filesCleared] = await Promise.all([clearSession(), clearFiles()])
    if (!sessionCleared || !filesCleared) {
      setPersistenceWarning('Session storage could not be cleared.')
    }
    storedSessionExistsRef.current = false
    setStatus({ status: 'idle' })
  }, [])

  useEffect(() => {
    if (status.status === 'active') {
      return
    }
    if (items.length > 0 && wasEmptyRef.current) {
      wasEmptyRef.current = false
      void startFresh()
    } else if (items.length === 0) {
      wasEmptyRef.current = true
    }
  }, [items.length, startFresh, status.status])

  useEffect(() => {
    if (status.status !== 'active') {
      return
    }
    const timer = window.setTimeout(() => {
      void writeSession(items, recipesById, uiState).then((ok) => {
        setPersistenceWarning(
          ok ? null : 'Session saving is unavailable; your work will not survive refresh.',
        )
      })
    }, SAVE_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [status.status, items, recipesById, uiState])

  useEffect(() => {
    if (status.status !== 'active') {
      return
    }
    const flush = () => {
      void writeSession(items, recipesById, uiState).then((ok) => {
        setPersistenceWarning(
          ok ? null : 'Session saving is unavailable; your work will not survive refresh.',
        )
      })
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
    persistenceWarning,
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
): Promise<boolean> {
  if (items.length === 0 || serializeItems(items).length === 0) {
    return clearSession()
  }
  return saveSession(buildSession(items, recipesById, ui))
}
