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

let dbPromise: Promise<IDBPDatabase<PhotoMoatDB> | null> | null = null

export function getDB(): Promise<IDBPDatabase<PhotoMoatDB> | null> | null {
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
    }).catch((_error: unknown) => {
      dbPromise = null
      return null
    })
  }

  return dbPromise
}

export async function resetDB(): Promise<void> {
  if (typeof indexedDB === 'undefined') {
    return
  }

  if (dbPromise) {
    const db = await dbPromise
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
