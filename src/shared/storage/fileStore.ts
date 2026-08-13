import { getDB } from '@/shared/storage/db'
import { WORKING_CATALOG_ID, type PersistedFileRecord } from '@/shared/storage/types'

/**
 * Build a `PersistedFileRecord` from a dropped-in `File`. The bytes are read
 * into an `ArrayBuffer` and name/type/lastModified are kept as separate
 * fields, so `fileFromRecord` can rebuild an identical `File` on restore.
 */
export async function recordFromFile(id: string, file: File): Promise<PersistedFileRecord> {
  return {
    id,
    catalogId: WORKING_CATALOG_ID,
    bytes: await file.arrayBuffer(),
    name: file.name,
    type: file.type,
    lastModified: file.lastModified,
  }
}

/** Rebuild a `File` from a stored record (object URLs are created by the caller). */
export function fileFromRecord(record: PersistedFileRecord): File {
  return new File([record.bytes], record.name, {
    type: record.type,
    lastModified: record.lastModified,
  })
}

export async function saveImage(id: string, file: File): Promise<boolean> {
  try {
    const db = getDB()
    if (!db) {
      return false
    }
    const connection = await db
    if (!connection) {
      return false
    }
    await connection.put('files', await recordFromFile(id, file))
    return true
  } catch {
    return false
  }
}

export async function getImage(id: string): Promise<PersistedFileRecord | null> {
  try {
    const db = getDB()
    if (!db) {
      return null
    }
    const connection = await db
    if (!connection) {
      return null
    }
    return ((await connection.get('files', id)) ?? null) as PersistedFileRecord | null
  } catch {
    return null
  }
}

export async function deleteImage(id: string): Promise<boolean> {
  try {
    const db = getDB()
    if (!db) {
      return false
    }
    const connection = await db
    if (!connection) {
      return false
    }
    await connection.delete('files', id)
    return true
  } catch {
    return false
  }
}

export async function clearFiles(): Promise<boolean> {
  try {
    const db = getDB()
    if (!db) {
      return false
    }
    const connection = await db
    if (!connection) {
      return false
    }
    await connection.clear('files')
    return true
  } catch {
    return false
  }
}
