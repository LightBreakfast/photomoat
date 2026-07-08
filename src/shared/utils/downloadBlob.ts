import type { ExportFormat } from '@/shared/types'

export type CanvasLike = {
  toBlob: (
    callback: BlobCallback,
    type?: string,
    quality?: number,
  ) => void
}

export async function canvasToBlob(
  canvas: CanvasLike,
  type: ExportFormat,
  quality = 0.92,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas export failed.'))
          return
        }

        resolve(blob)
      },
      type,
      type === 'image/jpeg' ? quality : undefined,
    )
  })
}

export function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = objectUrl
  anchor.download = filename
  anchor.rel = 'noopener'
  anchor.click()

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl)
  }, 0)
}
