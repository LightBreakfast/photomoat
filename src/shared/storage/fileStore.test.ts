import { beforeEach, describe, expect, it } from 'vitest'

import { resetDB } from '@/shared/storage/db'
import {
  clearFiles,
  deleteImage,
  fileFromRecord,
  getImage,
  recordFromFile,
  saveImage,
} from '@/shared/storage/fileStore'
import { WORKING_CATALOG_ID } from '@/shared/storage/types'

function makeFile(name = 'photo.jpg', type = 'image/jpeg', lastModified = 1234) {
  return new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], name, { type, lastModified })
}

beforeEach(async () => {
  await resetDB()
})

describe('fileStore', () => {
  it('round-trips a file through IndexedDB', async () => {
    const file = makeFile('beach.jpg', 'image/jpeg', 9876)
    await saveImage('img-1', file)

    const record = await getImage('img-1')
    expect(record).not.toBeNull()
    expect(record?.id).toBe('img-1')
    expect(record?.catalogId).toBe(WORKING_CATALOG_ID)
    expect(record?.name).toBe('beach.jpg')
    expect(record?.type).toBe('image/jpeg')
    expect(record?.lastModified).toBe(9876)
    expect(record?.bytes.byteLength).toBe(4)
  })

  it('returns null for a missing id', async () => {
    expect(await getImage('nope')).toBeNull()
  })

  it('reconstructs an equivalent File from a record', async () => {
    const file = makeFile('night.png', 'image/png', 424242)
    await saveImage('img-2', file)

    const record = await getImage('img-2')
    expect(record).not.toBeNull()
    const restored = fileFromRecord(record!)

    expect(restored.name).toBe('night.png')
    expect(restored.type).toBe('image/png')
    expect(restored.lastModified).toBe(424242)
    expect(await restored.arrayBuffer()).toEqual(await file.arrayBuffer())
  })

  it('deleteImage removes only the given id', async () => {
    await saveImage('img-3', makeFile('a.jpg'))
    await saveImage('img-4', makeFile('b.jpg'))

    await deleteImage('img-3')

    expect(await getImage('img-3')).toBeNull()
    expect(await getImage('img-4')).not.toBeNull()
  })

  it('clearFiles removes everything', async () => {
    await saveImage('img-5', makeFile('a.jpg'))
    await saveImage('img-6', makeFile('b.jpg'))

    await clearFiles()

    expect(await getImage('img-5')).toBeNull()
    expect(await getImage('img-6')).toBeNull()
  })

  it('recordFromFile keeps the catalog id for tier-2 catalogs', async () => {
    const record = await recordFromFile('img-7', makeFile('c.jpg'))
    expect(record.catalogId).toBe(WORKING_CATALOG_ID)
    expect(record.bytes.byteLength).toBe(4)
  })
})
