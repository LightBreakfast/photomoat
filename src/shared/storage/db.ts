import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

import type { PersistedFileRecord } from '@/shared/storage/types'

export const DATABASE_NAME = 'photomoat'
export const DATABASE_VERSION = 1

export interface PhotoMoatDB extends DBSchema {
  files: {
    key: string
    value: PersistedFileRecord
    indexes: { 'by-catalog': string }
  }
  kv: {
    key: string
    value: unknown
  }
}

let dbPromise: Promise<IDBPDatabase<PhotoMoatDB>> | null = null

/**
 * Open (lazily, once) the PhotoMoat database. Returns `null` when IndexedDB
 * is unavailable (SSR, tests without the polyfill, blocked storage) so
 * callers can degrade to in-memory operation. A failed open clears the cached
 * promise so a later call can retry.
 */
export function getDB(): Promise<IDBPDatabase<PhotoMoatDB>> | null {
  if (typeof indexedDB === 'undefined') {
    return null
  }

  if (!dbPromise) {
    dbPromise = openDB<PhotoMoatDB>(DATABASE_NAME, DATABASE_VERSION, {
      upgrade(db) {
        const files = db.createObjectStore('files', { keyPath: 'id' })
        files.createIndex('by-catalog', 'catalogId')
        db.createObjectStore('kv')
      },
    }).catch((error: unknown) => {
      dbPromise = null
      throw error
    })
  }

  return dbPromise
}

/** Close any open connection and delete the database. Used by tests. */
export async function resetDB(): Promise<void> {
  if (typeof indexedDB === 'undefined') {
    return
  }

  if (dbPromise) {
    const db = await dbPromise.catch(() => null)
    db?.close()
    dbPromise = null
  }

  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE_NAME)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => resolve()
  })
}
