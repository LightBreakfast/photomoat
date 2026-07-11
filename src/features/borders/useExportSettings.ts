import { useEffect, useState } from 'react'

import type { ExportSettings } from '@/features/borders/types'

export const exportSettingsStorageKey = 'photomoat-export-settings'

const defaultExportSettings: ExportSettings = {
  outputFormat: 'image/png',
  jpegQuality: 0.92,
}

function sanitizeExportSettings(settings: Partial<ExportSettings>): ExportSettings {
  return {
    outputFormat:
      settings.outputFormat === 'image/jpeg' ? 'image/jpeg' : 'image/png',
    jpegQuality:
      typeof settings.jpegQuality === 'number' && Number.isFinite(settings.jpegQuality)
        ? Math.min(1, Math.max(0, settings.jpegQuality))
        : defaultExportSettings.jpegQuality,
  } satisfies ExportSettings
}

function getStoredExportSettings(): ExportSettings {
  if (typeof window === 'undefined') {
    return defaultExportSettings
  }

  const rawValue = window.localStorage.getItem(exportSettingsStorageKey)

  if (!rawValue) {
    // Migrate from old combined storage key if present
    try {
      const oldValue = window.localStorage.getItem('photomoat-border-settings')
      if (oldValue) {
        const parsed = JSON.parse(oldValue) as Partial<ExportSettings>
        if (parsed.outputFormat || parsed.jpegQuality) {
          return sanitizeExportSettings(parsed)
        }
      }
    } catch {
      // fall through
    }

    return defaultExportSettings
  }

  try {
    return sanitizeExportSettings(JSON.parse(rawValue) as Partial<ExportSettings>)
  } catch {
    return defaultExportSettings
  }
}

export function useExportSettings() {
  const [settings, setSettings] = useState<ExportSettings>(() => getStoredExportSettings())

  useEffect(() => {
    window.localStorage.setItem(exportSettingsStorageKey, JSON.stringify(settings))
  }, [settings])

  return {
    settings,
    setOutputFormat: (outputFormat: ExportSettings['outputFormat']) =>
      setSettings((current) => ({ ...current, outputFormat })),
    setJpegQuality: (jpegQuality: number) =>
      setSettings((current) => ({ ...current, jpegQuality })),
  }
}

export { defaultExportSettings }
