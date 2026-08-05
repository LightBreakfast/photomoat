import JSZip from 'jszip'
import { describe, expect, it, vi } from 'vitest'

import { ensureUniqueFilename, exportZip } from '@/shared/utils/exportZip'

function createBlob(text: string) {
  return new Blob([text], { type: 'image/png' })
}

async function readArchive(blob: Blob): Promise<Record<string, string>> {
  const zip = await JSZip.loadAsync(blob)
  const entries: Record<string, string> = {}

  for (const [name, file] of Object.entries(zip.files)) {
    if (!file.dir) {
      entries[name] = await file.async('string')
    }
  }

  return entries
}

describe('ensureUniqueFilename', () => {
  it('passes through unused names', () => {
    const used = new Set<string>()

    expect(ensureUniqueFilename(used, 'one.png')).toBe('one.png')
    expect(used).toEqual(new Set(['one.png']))
  })

  it('suffixes collisions before the extension', () => {
    const used = new Set<string>(['one.png'])

    expect(ensureUniqueFilename(used, 'one.png')).toBe('one-2.png')
    expect(ensureUniqueFilename(used, 'one.png')).toBe('one-3.png')
    expect(ensureUniqueFilename(used, 'one.png')).toBe('one-4.png')
  })

  it('skips names already claimed by previous dedupes', () => {
    const used = new Set<string>(['one.png', 'one-2.png'])

    expect(ensureUniqueFilename(used, 'one.png')).toBe('one-3.png')
  })

  it('handles filenames without an extension', () => {
    const used = new Set<string>(['one'])

    expect(ensureUniqueFilename(used, 'one')).toBe('one-2')
  })
})

describe('exportZip', () => {
  it('keeps every entry when patterns collide (no silent overwrites)', async () => {
    const saveAs = vi.fn()

    await exportZip({
      items: ['first', 'second'],
      zipFilename: 'out.zip',
      createEntry: async (item) => ({ filename: '2026-08-05.png', blob: createBlob(item) }),
      saveAs,
    })

    const archive = await readArchive(saveAs.mock.calls[0][0] as Blob)
    expect(archive).toEqual({
      '2026-08-05.png': 'first',
      '2026-08-05-2.png': 'second',
    })
  })

  it('increments suffixes for three-way collisions', async () => {
    const saveAs = vi.fn()

    await exportZip({
      items: ['a', 'b', 'c'],
      zipFilename: 'out.zip',
      createEntry: async (item) => ({ filename: 'x.png', blob: createBlob(item) }),
      saveAs,
    })

    const archive = await readArchive(saveAs.mock.calls[0][0] as Blob)
    expect(archive).toEqual({
      'x.png': 'a',
      'x-2.png': 'b',
      'x-3.png': 'c',
    })
  })

  it('leaves unique filenames untouched', async () => {
    const saveAs = vi.fn()

    await exportZip({
      items: ['a', 'b'],
      zipFilename: 'out.zip',
      createEntry: async (item, index) => ({
        filename: index === 0 ? 'one.png' : 'two.png',
        blob: createBlob(item),
      }),
      saveAs,
    })

    const archive = await readArchive(saveAs.mock.calls[0][0] as Blob)
    expect(archive).toEqual({ 'one.png': 'a', 'two.png': 'b' })
  })

  it('reports the deduped filename in progress', async () => {
    const onProgress = vi.fn()
    const saveAs = vi.fn()

    await exportZip({
      items: ['a', 'b'],
      zipFilename: 'out.zip',
      createEntry: async (item) => ({ filename: 'same.png', blob: createBlob(item) }),
      onProgress,
      saveAs,
    })

    expect(onProgress).toHaveBeenNthCalledWith(1, { current: 1, total: 2, filename: 'same.png' })
    expect(onProgress).toHaveBeenNthCalledWith(2, { current: 2, total: 2, filename: 'same-2.png' })
  })
})
