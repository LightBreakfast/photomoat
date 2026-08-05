import JSZip from 'jszip'

import { downloadBlob } from '@/shared/utils/downloadBlob'

export type ZipProgress = {
  current: number
  total: number
  filename: string
}

type ExportZipOptions<T> = {
  items: T[]
  zipFilename: string
  createEntry: (item: T, index: number) => Promise<{ filename: string; blob: Blob }>
  onProgress?: (progress: ZipProgress) => void
  saveAs?: (blob: Blob, filename: string) => void
}

/**
 * Returns a filename that is not yet in `usedNames`, appending `-2`, `-3`, …
 * before the extension on collisions. JSZip overwrites entries with duplicate
 * paths, so deduplication prevents patterns like `{date}` from silently
 * dropping images from the archive.
 */
export function ensureUniqueFilename(usedNames: Set<string>, filename: string) {
  if (!usedNames.has(filename)) {
    usedNames.add(filename)
    return filename
  }

  const extensionIndex = filename.lastIndexOf('.')
  const base = extensionIndex > 0 ? filename.slice(0, extensionIndex) : filename
  const extension = extensionIndex > 0 ? filename.slice(extensionIndex) : ''
  let counter = 2
  let candidate = `${base}-${counter}${extension}`

  while (usedNames.has(candidate)) {
    counter += 1
    candidate = `${base}-${counter}${extension}`
  }

  usedNames.add(candidate)
  return candidate
}

export async function exportZip<T>({
  items,
  zipFilename,
  createEntry,
  onProgress,
  saveAs = downloadBlob,
}: ExportZipOptions<T>) {
  const zip = new JSZip()
  const usedFilenames = new Set<string>()

  for (const [index, item] of items.entries()) {
    const entry = await createEntry(item, index)
    const filename = ensureUniqueFilename(usedFilenames, entry.filename)
    zip.file(filename, entry.blob)
    onProgress?.({
      current: index + 1,
      total: items.length,
      filename,
    })
  }

  const archive = await zip.generateAsync({ type: 'blob' })
  saveAs(archive, zipFilename)

  return archive
}
