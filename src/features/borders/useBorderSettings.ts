import { useEffect, useState } from 'react'

import type { BorderSettings } from '@/features/borders/types'

export const borderSettingsStorageKey = 'photomoat-border-settings'

const defaultSettings: BorderSettings = {
  presetId: 'instagram-square',
  backgroundColor: '#ffffff',
  outputFormat: 'image/png',
  jpegQuality: 0.92,
  imageSizingMode: 'contain',
  imageEdgePixels: 900,
  borderWidthPixels: 90,
}

function sanitizePositiveInteger(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(1, Math.round(value))
    : fallback
}

function sanitizeSettings(settings: Partial<BorderSettings>) {
  return {
    ...defaultSettings,
    ...settings,
    imageSizingMode:
      settings.imageSizingMode === 'long-edge' ||
      settings.imageSizingMode === 'short-edge' ||
      settings.imageSizingMode === 'border-width'
        ? settings.imageSizingMode
        : 'contain',
    imageEdgePixels: sanitizePositiveInteger(
      settings.imageEdgePixels,
      defaultSettings.imageEdgePixels,
    ),
    borderWidthPixels: sanitizePositiveInteger(
      settings.borderWidthPixels,
      defaultSettings.borderWidthPixels,
    ),
  } satisfies BorderSettings
}

function getStoredSettings() {
  if (typeof window === 'undefined') {
    return defaultSettings
  }

  const rawValue = window.localStorage.getItem(borderSettingsStorageKey)

  if (!rawValue) {
    return defaultSettings
  }

  try {
    return sanitizeSettings(JSON.parse(rawValue) as Partial<BorderSettings>)
  } catch {
    return defaultSettings
  }
}

export function useBorderSettings() {
  const [settings, setSettings] = useState<BorderSettings>(() => getStoredSettings())

  useEffect(() => {
    window.localStorage.setItem(borderSettingsStorageKey, JSON.stringify(settings))
  }, [settings])

  return {
    settings,
    setPresetId: (presetId: BorderSettings['presetId']) =>
      setSettings((current) => ({ ...current, presetId })),
    setBackgroundColor: (backgroundColor: string) =>
      setSettings((current) => ({ ...current, backgroundColor })),
    setOutputFormat: (outputFormat: BorderSettings['outputFormat']) =>
      setSettings((current) => ({ ...current, outputFormat })),
    setJpegQuality: (jpegQuality: number) =>
      setSettings((current) => ({ ...current, jpegQuality })),
    setImageSizingMode: (imageSizingMode: BorderSettings['imageSizingMode']) =>
      setSettings((current) => ({ ...current, imageSizingMode })),
    setImageEdgePixels: (imageEdgePixels: number) =>
      setSettings((current) => ({
        ...current,
        imageEdgePixels: Math.max(1, Math.round(imageEdgePixels)),
      })),
    setBorderWidthPixels: (borderWidthPixels: number) =>
      setSettings((current) => ({
        ...current,
        borderWidthPixels: Math.max(1, Math.round(borderWidthPixels)),
      })),
  }
}

export { defaultSettings as defaultBorderSettings, getStoredSettings }
