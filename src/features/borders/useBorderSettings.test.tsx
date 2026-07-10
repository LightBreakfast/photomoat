import { renderHook } from '@testing-library/react'
import { act } from 'react'
import { describe, expect, it } from 'vitest'

import {
  borderSettingsStorageKey,
  defaultBorderSettings,
  useBorderSettings,
} from '@/features/borders/useBorderSettings'

describe('useBorderSettings', () => {
  it('loads default settings and persists updates', () => {
    window.localStorage.removeItem(borderSettingsStorageKey)

    const { result } = renderHook(() => useBorderSettings())

    expect(result.current.settings).toEqual(defaultBorderSettings)

    act(() => {
      result.current.setPresetId('instagram-story')
      result.current.setBackgroundColor('#000000')
      result.current.setOutputFormat('image/jpeg')
      result.current.setJpegQuality(0.8)
      result.current.setImageSizingMode('border-width')
      result.current.setImageEdgePixels(840)
      result.current.setBorderWidthPixels(72)
      result.current.setCustomWidth(1920)
      result.current.setCustomHeight(1080)
      result.current.setFilterPresetId('ember')
    })

    expect(JSON.parse(window.localStorage.getItem(borderSettingsStorageKey) ?? '{}')).toEqual({
      presetId: 'instagram-story',
      backgroundColor: '#000000',
      outputFormat: 'image/jpeg',
      jpegQuality: 0.8,
      imageSizingMode: 'border-width',
      imageEdgePixels: 840,
      borderWidthPixels: 72,
      customWidth: 1920,
      customHeight: 1080,
      filterPresetId: 'ember',
    })
  })

  it('accepts fill sizing mode', () => {
    window.localStorage.removeItem(borderSettingsStorageKey)

    const { result } = renderHook(() => useBorderSettings())

    act(() => {
      result.current.setImageSizingMode('fill')
    })

    expect(result.current.settings.imageSizingMode).toBe('fill')
  })

  it('accepts custom preset id', () => {
    window.localStorage.removeItem(borderSettingsStorageKey)

    const { result } = renderHook(() => useBorderSettings())

    act(() => {
      result.current.setPresetId('custom')
    })

    expect(result.current.settings.presetId).toBe('custom')
  })

  it('clamps custom dimensions to valid range', () => {
    window.localStorage.removeItem(borderSettingsStorageKey)

    const { result } = renderHook(() => useBorderSettings())

    act(() => {
      result.current.setCustomWidth(50)
      result.current.setCustomHeight(20000)
    })

    expect(result.current.settings.customWidth).toBe(100)
    expect(result.current.settings.customHeight).toBe(10000)
  })

  it('accepts valid filter preset id', () => {
    window.localStorage.removeItem(borderSettingsStorageKey)

    const { result } = renderHook(() => useBorderSettings())

    act(() => {
      result.current.setFilterPresetId('ember')
    })

    expect(result.current.settings.filterPresetId).toBe('ember')
  })

  it('falls back to original for invalid persisted filter preset id', () => {
    window.localStorage.setItem(
      borderSettingsStorageKey,
      JSON.stringify({ filterPresetId: 'not-a-real-preset' }),
    )

    const { result } = renderHook(() => useBorderSettings())

    expect(result.current.settings.filterPresetId).toBe('original')
  })
})
