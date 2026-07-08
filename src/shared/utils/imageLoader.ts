import type { ImageDimensions } from '@/shared/types'

export function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('This image could not be loaded.'))
    image.src = src
  })
}

export async function getImageDimensions(file: File, objectUrl?: string) {
  const sourceUrl = objectUrl ?? URL.createObjectURL(file)

  try {
    const image = await loadImageElement(sourceUrl)

    return {
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
    } satisfies ImageDimensions
  } finally {
    if (!objectUrl) {
      URL.revokeObjectURL(sourceUrl)
    }
  }
}
