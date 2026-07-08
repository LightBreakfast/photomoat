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
    })

    expect(JSON.parse(window.localStorage.getItem(borderSettingsStorageKey) ?? '{}')).toEqual({
      presetId: 'instagram-story',
      backgroundColor: '#000000',
      outputFormat: 'image/jpeg',
      jpegQuality: 0.8,
      imageSizingMode: 'border-width',
      imageEdgePixels: 840,
      borderWidthPixels: 72,
    })
  })
})
