import { useEffect, useState } from 'react'

import { customSizeMax, customSizeMin } from '@/features/borders/constants'
import { defaultImageRecipe } from '@/features/borders/defaultImageRecipe'
import { defaultFilterPresetId, isFilterPresetId } from '@/features/borders/filterPresets'
import type { BorderSettings, FilterPresetId } from '@/features/borders/types'
import { defaultExportSettings } from '@/features/borders/useExportSettings'

export const borderSettingsStorageKey = 'photomoat-border-settings'

const defaultSettings: BorderSettings = {
  ...defaultImageRecipe,
  ...defaultExportSettings,
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

function sanitizeFilterPresetId(value: unknown): FilterPresetId {
  return isFilterPresetId(value) ? value : defaultFilterPresetId
}

function sanitizeSettings(settings: Partial<BorderSettings>) {
  return {
    ...defaultSettings,
    ...settings,
    imageSizingMode:
      settings.imageSizingMode === 'long-edge' ||
      settings.imageSizingMode === 'short-edge' ||
      settings.imageSizingMode === 'border-width' ||
      settings.imageSizingMode === 'fixed-sides' ||
      settings.imageSizingMode === 'fill'
        ? settings.imageSizingMode
        : defaultSettings.imageSizingMode,
    imageEdgePixels: sanitizePositiveInteger(
      settings.imageEdgePixels,
      defaultSettings.imageEdgePixels,
    ),
    borderWidthPixels: sanitizePositiveInteger(
      settings.borderWidthPixels,
      defaultSettings.borderWidthPixels,
    ),
    minVerticalPaddingPixels: sanitizePositiveInteger(
      settings.minVerticalPaddingPixels,
      defaultSettings.minVerticalPaddingPixels,
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
    filterPresetId: sanitizeFilterPresetId(settings.filterPresetId),
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
    setMinVerticalPaddingPixels: (minVerticalPaddingPixels: number) =>
      setSettings((current) => ({
        ...current,
        minVerticalPaddingPixels: Math.max(1, Math.round(minVerticalPaddingPixels)),
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
    setFilterPresetId: (filterPresetId: FilterPresetId) =>
      setSettings((current) => ({ ...current, filterPresetId })),
  }
}

export { defaultSettings as defaultBorderSettings, getStoredSettings }
