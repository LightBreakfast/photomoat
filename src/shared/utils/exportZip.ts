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

export async function exportZip<T>({
  items,
  zipFilename,
  createEntry,
  onProgress,
  saveAs = downloadBlob,
}: ExportZipOptions<T>) {
  const zip = new JSZip()

  for (const [index, item] of items.entries()) {
    const entry = await createEntry(item, index)
    zip.file(entry.filename, entry.blob)
    onProgress?.({
      current: index + 1,
      total: items.length,
      filename: entry.filename,
    })
  }

  const archive = await zip.generateAsync({ type: 'blob' })
  saveAs(archive, zipFilename)

  return archive
}
