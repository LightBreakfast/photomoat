import type { ExportFormat } from '@/shared/types'

export const defaultFilenamePattern = '{name}-bordered'
export const defaultFolderName = 'photomoat-borders'

/** Tokens that can be inserted into a filename pattern. */
export const filenamePatternTokens = ['{name}', '{date}', '{time}', '{datetime}'] as const

const patternTokenRegex = /\{(name|date|time|datetime)\}/g

function getExtensionFromFormat(format: ExportFormat) {
  return format === 'image/png' ? 'png' : 'jpg'
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

/** Local-time `YYYY-MM-DD`. */
export function formatExportDate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Local-time `HHMMSS`. */
export function formatExportTime(date = new Date()) {
  return `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
}

/** Local-time `YYYY-MM-DD-HHMMSS`. */
export function formatExportDateTime(date = new Date()) {
  return `${formatExportDate(date)}-${formatExportTime(date)}`
}

export function getBaseFilename(filename: string) {
  const extensionIndex = filename.lastIndexOf('.')

  return extensionIndex > 0 ? filename.slice(0, extensionIndex) : filename
}

/**
 * Renders a filename pattern, substituting `{name}`, `{date}`, `{time}` and `{datetime}`.
 * Unknown tokens are left literal; an empty/whitespace pattern falls back to the default.
 */
export function applyFilenamePattern(pattern: string, name: string, date = new Date()) {
  const values: Record<string, string> = {
    name,
    date: formatExportDate(date),
    time: formatExportTime(date),
    datetime: formatExportDateTime(date),
  }

  return (pattern.trim() || defaultFilenamePattern).replace(patternTokenRegex, (_match, token) => {
    return values[token]
  })
}

export type CreateExportFilenameOptions = {
  originalFilename: string
  format: ExportFormat
  pattern: string
  date?: Date
}

/** Renders the full export filename: `<pattern result>.<extension>`. */
export function createExportFilename({
  originalFilename,
  format,
  pattern,
  date,
}: CreateExportFilenameOptions) {
  // Path separators are stripped so ZIP entries stay flat and downloads stay
  // single files (matches the folder-name sanitizer's rules).
  const base = applyFilenamePattern(pattern, getBaseFilename(originalFilename), date).replace(
    /[/\\]/g,
    '',
  )

  return `${base}.${getExtensionFromFormat(format)}`
}

/** Sanitizes a folder name into a `*.zip` archive name. */
export function createExportZipName(folderName: string) {
  const cleaned = folderName
    .trim()
    .replace(/[/\\]/g, '')
    .replace(/\.zip$/i, '')

  return `${cleaned || defaultFolderName}.zip`
}

/** Wrapper over `createExportFilename` reproducing the historical default pattern. */
export function createBorderedFilename(
  originalFilename: string,
  format: ExportFormat,
) {
  return createExportFilename({
    originalFilename,
    format,
    pattern: defaultFilenamePattern,
  })
}
