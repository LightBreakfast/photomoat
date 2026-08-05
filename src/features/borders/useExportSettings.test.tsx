import { renderHook } from '@testing-library/react'
import { act } from 'react'
import { describe, expect, it } from 'vitest'

import {
  defaultExportSettings,
  exportSettingsStorageKey,
  useExportSettings,
} from '@/features/borders/useExportSettings'

describe('useExportSettings', () => {
  it('loads default settings and persists updates', () => {
    window.localStorage.removeItem(exportSettingsStorageKey)

    const { result } = renderHook(() => useExportSettings())

    expect(result.current.settings).toEqual(defaultExportSettings)

    act(() => {
      result.current.setOutputFormat('image/jpeg')
      result.current.setJpegQuality(0.8)
      result.current.setFilenamePattern('{name}-{datetime}')
      result.current.setFolderName('holiday-2026')
    })

    expect(JSON.parse(window.localStorage.getItem(exportSettingsStorageKey) ?? '{}')).toEqual({
      outputFormat: 'image/jpeg',
      jpegQuality: 0.8,
      filenamePattern: '{name}-{datetime}',
      folderName: 'holiday-2026',
    })
  })

  it('falls back to defaults for invalid persisted output format', () => {
    window.localStorage.setItem(
      exportSettingsStorageKey,
      JSON.stringify({ outputFormat: 'image/webp' }),
    )

    const { result } = renderHook(() => useExportSettings())

    expect(result.current.settings.outputFormat).toBe('image/png')
    expect(result.current.settings.jpegQuality).toBe(0.92)
  })

  it('falls back to the default pattern for an empty or whitespace persisted pattern', () => {
    window.localStorage.setItem(
      exportSettingsStorageKey,
      JSON.stringify({ filenamePattern: '   ' }),
    )

    const { result } = renderHook(() => useExportSettings())

    expect(result.current.settings.filenamePattern).toBe(defaultExportSettings.filenamePattern)
  })

  it('trims persisted pattern and strips path separators from the folder name', () => {
    window.localStorage.setItem(
      exportSettingsStorageKey,
      JSON.stringify({ filenamePattern: '  {name}  ', folderName: 'a/b\\c' }),
    )

    const { result } = renderHook(() => useExportSettings())

    expect(result.current.settings.filenamePattern).toBe('{name}')
    expect(result.current.settings.folderName).toBe('abc')
  })

  it('falls back to the default folder name for invalid persisted folder name', () => {
    window.localStorage.setItem(
      exportSettingsStorageKey,
      JSON.stringify({ folderName: '' }),
    )

    const { result } = renderHook(() => useExportSettings())

    expect(result.current.settings.folderName).toBe(defaultExportSettings.folderName)
  })

  it('falls back to the default folder name when only separators remain', () => {
    window.localStorage.setItem(
      exportSettingsStorageKey,
      JSON.stringify({ folderName: '///' }),
    )

    const { result } = renderHook(() => useExportSettings())

    expect(result.current.settings.folderName).toBe(defaultExportSettings.folderName)
  })

  it('migrates export fields from the old combined storage key', () => {
    window.localStorage.removeItem(exportSettingsStorageKey)
    window.localStorage.setItem(
      'photomoat-border-settings',
      JSON.stringify({ outputFormat: 'image/jpeg', jpegQuality: 0.75 }),
    )

    const { result } = renderHook(() => useExportSettings())

    expect(result.current.settings.outputFormat).toBe('image/jpeg')
    expect(result.current.settings.jpegQuality).toBe(0.75)
    expect(result.current.settings.filenamePattern).toBe(defaultExportSettings.filenamePattern)
    expect(result.current.settings.folderName).toBe(defaultExportSettings.folderName)
  })

  it('recovers from corrupt persisted JSON', () => {
    window.localStorage.setItem(exportSettingsStorageKey, 'not-json{')

    const { result } = renderHook(() => useExportSettings())

    expect(result.current.settings).toEqual(defaultExportSettings)
  })

  it('resets all settings to defaults', () => {
    window.localStorage.removeItem(exportSettingsStorageKey)

    const { result } = renderHook(() => useExportSettings())

    act(() => {
      result.current.setFilenamePattern('{name}-{date}')
      result.current.setFolderName('custom')
    })

    act(() => {
      result.current.resetExportSettings()
    })

    expect(result.current.settings).toEqual(defaultExportSettings)
  })
})
