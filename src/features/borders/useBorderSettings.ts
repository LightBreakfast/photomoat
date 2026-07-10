import { useEffect, useState } from 'react'

import {
  customSizeMax,
  customSizeMin,
  defaultCustomHeight,
  defaultCustomWidth,
} from '@/features/borders/constants'
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
  customWidth: defaultCustomWidth,
  customHeight: defaultCustomHeight,
}

function sanitizePositiveInteger(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(1, Math.round(value))
    : fallback
}

function sanitizePositiveIntegerInRange(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.min(max, Math.max(min, Math.round(value)))
  }
  return fallback
}

function sanitizeSettings(settings: Partial<BorderSettings>) {
  return {
    ...defaultSettings,
    ...settings,
    imageSizingMode:
      settings.imageSizingMode === 'long-edge' ||
      settings.imageSizingMode === 'short-edge' ||
      settings.imageSizingMode === 'border-width' ||
      settings.imageSizingMode === 'fill'
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
    customWidth: sanitizePositiveIntegerInRange(
      settings.customWidth,
      defaultSettings.customWidth,
      customSizeMin,
      customSizeMax,
    ),
    customHeight: sanitizePositiveIntegerInRange(
      settings.customHeight,
      defaultSettings.customHeight,
      customSizeMin,
      customSizeMax,
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
    setCustomWidth: (customWidth: number) =>
      setSettings((current) => ({
        ...current,
        customWidth: Math.min(customSizeMax, Math.max(customSizeMin, Math.round(customWidth))),
      })),
    setCustomHeight: (customHeight: number) =>
      setSettings((current) => ({
        ...current,
        customHeight: Math.min(customSizeMax, Math.max(customSizeMin, Math.round(customHeight))),
      })), 
  }
}

export { defaultSettings as defaultBorderSettings, getStoredSettings }
