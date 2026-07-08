import type { ExportFormat } from '@/shared/types'

function getExtensionFromFormat(format: ExportFormat) {
  return format === 'image/png' ? 'png' : 'jpg'
}

export function getBaseFilename(filename: string) {
  const extensionIndex = filename.lastIndexOf('.')

  return extensionIndex > 0 ? filename.slice(0, extensionIndex) : filename
}

export function createBorderedFilename(
  originalFilename: string,
  format: ExportFormat,
) {
  return `${getBaseFilename(originalFilename)}-bordered.${getExtensionFromFormat(format)}`
}
