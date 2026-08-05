import { describe, expect, it } from 'vitest'

import {
  applyFilenamePattern,
  createBorderedFilename,
  createExportFilename,
  createExportZipName,
  defaultFilenamePattern,
  defaultFolderName,
  formatExportDate,
  formatExportDateTime,
  formatExportTime,
  getBaseFilename,
} from '@/shared/utils/filename'

// Local-time fixture; Date constructor args are interpreted in local time.
const fixedDate = new Date(2026, 6, 15, 9, 5, 3)

describe('filename helpers', () => {
  it('removes an extension from the original filename', () => {
    expect(getBaseFilename('portrait.final.jpg')).toBe('portrait.final')
  })

  it('creates the bordered filename pattern', () => {
    expect(createBorderedFilename('portrait.final.jpg', 'image/png')).toBe(
      'portrait.final-bordered.png',
    )
  })
})

describe('export timestamps', () => {
  it('formats the date as YYYY-MM-DD', () => {
    expect(formatExportDate(fixedDate)).toBe('2026-07-15')
  })

  it('zero-pads months and days', () => {
    expect(formatExportDate(new Date(2026, 0, 3))).toBe('2026-01-03')
  })

  it('formats the time as HHMMSS', () => {
    expect(formatExportTime(fixedDate)).toBe('090503')
  })

  it('formats date and time together', () => {
    expect(formatExportDateTime(fixedDate)).toBe('2026-07-15-090503')
  })
})

describe('applyFilenamePattern', () => {
  it('substitutes the name token', () => {
    expect(applyFilenamePattern('{name}', 'portrait', fixedDate)).toBe('portrait')
  })

  it('substitutes date, time and datetime tokens', () => {
    expect(applyFilenamePattern('{date}', 'portrait', fixedDate)).toBe('2026-07-15')
    expect(applyFilenamePattern('{time}', 'portrait', fixedDate)).toBe('090503')
    expect(applyFilenamePattern('{datetime}', 'portrait', fixedDate)).toBe('2026-07-15-090503')
  })

  it('composes tokens around literal text', () => {
    expect(applyFilenamePattern('{name}-bordered-{date}', 'portrait', fixedDate)).toBe(
      'portrait-bordered-2026-07-15',
    )
  })

  it('replaces repeated tokens', () => {
    expect(applyFilenamePattern('{date}_{date}', 'portrait', fixedDate)).toBe(
      '2026-07-15_2026-07-15',
    )
  })

  it('leaves unknown tokens literal', () => {
    expect(applyFilenamePattern('{name}-{size}', 'portrait', fixedDate)).toBe('portrait-{size}')
  })

  it('falls back to the default pattern for an empty or whitespace pattern', () => {
    expect(applyFilenamePattern('', 'portrait', fixedDate)).toBe('portrait-bordered')
    expect(applyFilenamePattern('   ', 'portrait', fixedDate)).toBe('portrait-bordered')
  })

  it('trims surrounding whitespace from the pattern', () => {
    expect(applyFilenamePattern('  {name}  ', 'portrait', fixedDate)).toBe('portrait')
  })
})

describe('createExportFilename', () => {
  it('renders pattern with the format extension', () => {
    expect(
      createExportFilename({
        originalFilename: 'portrait.jpg',
        format: 'image/png',
        pattern: '{name}-bordered-{date}',
        date: fixedDate,
      }),
    ).toBe('portrait-bordered-2026-07-15.png')
  })

  it('uses jpg extension for JPEG output', () => {
    expect(
      createExportFilename({
        originalFilename: 'portrait.png',
        format: 'image/jpeg',
        pattern: '{name}',
        date: fixedDate,
      }),
    ).toBe('portrait.jpg')
  })

  it('handles filenames without an extension', () => {
    expect(
      createExportFilename({
        originalFilename: 'portrait',
        format: 'image/png',
        pattern: '{name}',
        date: fixedDate,
      }),
    ).toBe('portrait.png')
  })

  it('handles multi-dot and unicode names', () => {
    expect(
      createExportFilename({
        originalFilename: 'final.v2.jpg',
        format: 'image/png',
        pattern: '{name}',
        date: fixedDate,
      }),
    ).toBe('final.v2.png')
    expect(
      createExportFilename({
        originalFilename: 'café.png',
        format: 'image/jpeg',
        pattern: '{name}',
        date: fixedDate,
      }),
    ).toBe('café.jpg')
  })

  it('strips path separators so ZIP entries stay flat', () => {
    expect(
      createExportFilename({
        originalFilename: 'portrait.jpg',
        format: 'image/png',
        pattern: 'album/{name}',
        date: fixedDate,
      }),
    ).toBe('albumportrait.png')
    expect(
      createExportFilename({
        originalFilename: 'portrait.jpg',
        format: 'image/png',
        pattern: 'a\\b\\{name}',
        date: fixedDate,
      }),
    ).toBe('abportrait.png')
  })
})

describe('createExportZipName', () => {
  it('appends the zip extension', () => {
    expect(createExportZipName('my-folder')).toBe('my-folder.zip')
  })

  it('does not duplicate an existing zip extension', () => {
    expect(createExportZipName('my-folder.zip')).toBe('my-folder.zip')
    expect(createExportZipName('my-folder.ZIP')).toBe('my-folder.zip')
  })

  it('strips path separators', () => {
    expect(createExportZipName('a/b\\c')).toBe('abc.zip')
  })

  it('trims whitespace', () => {
    expect(createExportZipName('  my-folder  ')).toBe('my-folder.zip')
  })

  it('falls back to the default folder name when empty', () => {
    expect(createExportZipName('')).toBe(`${defaultFolderName}.zip`)
    expect(createExportZipName('   ')).toBe(`${defaultFolderName}.zip`)
    expect(createExportZipName('.zip')).toBe(`${defaultFolderName}.zip`)
  })

  it('defaults to the standard archive name', () => {
    expect(createExportZipName(defaultFolderName)).toBe('photomoat-borders.zip')
    expect(defaultFilenamePattern).toBe('{name}-bordered')
  })

  it('applies date and datetime tokens to the folder name', () => {
    expect(createExportZipName('backup-{date}', { date: fixedDate })).toBe(
      'backup-2026-07-15.zip',
    )
    expect(createExportZipName('{datetime}', { date: fixedDate })).toBe(
      '2026-07-15-090503.zip',
    )
  })

  it('substitutes the name token with the first export item', () => {
    expect(createExportZipName('{name}-trip', { originalFilename: 'IMG_001.jpg' })).toBe(
      'IMG_001-trip.zip',
    )
  })

  it('leaves unknown tokens literal in the folder name', () => {
    expect(createExportZipName('x-{size}', { date: fixedDate })).toBe('x-{size}.zip')
  })

  it('strips separators after token substitution', () => {
    expect(createExportZipName('a/{date}', { date: fixedDate })).toBe('a2026-07-15.zip')
  })

  it('falls back to the default when substitution leaves nothing', () => {
    expect(createExportZipName('///{name}')).toBe(`${defaultFolderName}.zip`)
  })
})
