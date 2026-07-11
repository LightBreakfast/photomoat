import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { ImageEditRecipe } from '@/features/borders/types'
import { useImageEdits } from '@/features/borders/useImageEdits'

const defaultRecipe: ImageEditRecipe = {
  presetId: 'instagram-square',
  backgroundColor: '#ffffff',
  imageSizingMode: 'contain',
  imageEdgePixels: 900,
  borderWidthPixels: 90,
  minVerticalPaddingPixels: 90,
  customWidth: 1080,
  customHeight: 1080,
  filterPresetId: 'original',
}

const emberRecipe: ImageEditRecipe = {
  ...defaultRecipe,
  filterPresetId: 'ember',
}

describe('useImageEdits', () => {
  it('initializes recipes for new ids', () => {
    const { result } = renderHook(() => useImageEdits(defaultRecipe))

    act(() => {
      result.current.initializeImages(['a', 'b'])
    })

    expect(result.current.getRecipe('a')).toEqual(defaultRecipe)
    expect(result.current.getRecipe('b')).toEqual(defaultRecipe)
  })

  it('does not overwrite existing recipes on initialize', () => {
    const { result } = renderHook(() => useImageEdits(defaultRecipe))

    act(() => {
      result.current.initializeImages(['a'])
      result.current.patchImage('a', { filterPresetId: 'ember' })
      result.current.initializeImages(['a', 'b'])
    })

    expect(result.current.getRecipe('a').filterPresetId).toBe('ember')
    expect(result.current.getRecipe('b').filterPresetId).toBe('original')
  })

  it('patches one image', () => {
    const { result } = renderHook(() => useImageEdits(defaultRecipe))

    act(() => {
      result.current.initializeImages(['a'])
      result.current.patchImage('a', { backgroundColor: '#000000' })
    })

    expect(result.current.getRecipe('a').backgroundColor).toBe('#000000')
    expect(result.current.getRecipe('a').filterPresetId).toBe('original')
  })

  it('replaces one image recipe', () => {
    const { result } = renderHook(() => useImageEdits(defaultRecipe))

    act(() => {
      result.current.initializeImages(['a'])
      result.current.replaceImageRecipe('a', emberRecipe)
    })

    expect(result.current.getRecipe('a')).toEqual(emberRecipe)
  })

  it('replaces many images with one source recipe', () => {
    const { result } = renderHook(() => useImageEdits(defaultRecipe))

    act(() => {
      result.current.initializeImages(['a', 'b', 'c'])
      result.current.replaceImagesWithRecipe(['a', 'c'], emberRecipe)
    })

    expect(result.current.getRecipe('a').filterPresetId).toBe('ember')
    expect(result.current.getRecipe('b').filterPresetId).toBe('original')
    expect(result.current.getRecipe('c').filterPresetId).toBe('ember')
  })

  it('removes single image recipe', () => {
    const { result } = renderHook(() => useImageEdits(defaultRecipe))

    act(() => {
      result.current.initializeImages(['a', 'b'])
      result.current.removeImage('a')
    })

    expect(result.current.getRecipe('a')).toEqual(defaultRecipe) // fallback
    expect(result.current.getRecipe('b')).toEqual(defaultRecipe)
  })

  it('removes multiple image recipes', () => {
    const { result } = renderHook(() => useImageEdits(defaultRecipe))

    act(() => {
      result.current.initializeImages(['a', 'b', 'c'])
      result.current.removeImages(['a', 'c'])
    })

    expect(result.current.getRecipe('a')).toEqual(defaultRecipe)
    expect(result.current.getRecipe('b')).toEqual(defaultRecipe)
    expect(result.current.getRecipe('c')).toEqual(defaultRecipe)
  })

  it('returns default for unknown ids', () => {
    const { result } = renderHook(() => useImageEdits(defaultRecipe))

    expect(result.current.getRecipe('unknown')).toEqual(defaultRecipe)
  })

  it('recipesById reflects current state', () => {
    const { result } = renderHook(() => useImageEdits(defaultRecipe))

    act(() => {
      result.current.initializeImages(['a'])
      result.current.patchImage('a', { filterPresetId: 'noir' })
    })

    expect(result.current.recipesById['a'].filterPresetId).toBe('noir')
  })
})
