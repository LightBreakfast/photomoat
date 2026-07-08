import type { ImageMimeType } from '@/shared/types'

const acceptedExtensions = ['.jpg', '.jpeg', '.png']
export const acceptedImageMimeTypes: ImageMimeType[] = ['image/jpeg', 'image/png']

export function isAcceptedImageFile(file: File) {
  const fileName = file.name.toLowerCase()
  const extensionMatches = acceptedExtensions.some((extension) =>
    fileName.endsWith(extension),
  )

  return acceptedImageMimeTypes.includes(file.type as ImageMimeType) || extensionMatches
}

export function partitionImageFiles(files: File[]) {
  return files.reduce(
    (result, file) => {
      if (isAcceptedImageFile(file)) {
        result.accepted.push(file)
      } else {
        result.rejected.push(file)
      }

      return result
    },
    { accepted: [] as File[], rejected: [] as File[] },
  )
}
