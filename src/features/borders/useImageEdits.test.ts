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
  rotationDegrees: 0,
  flipHorizontal: false,
  flipVertical: false,
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

  it('recipesById reflects current committed state', () => {
    const { result } = renderHook(() => useImageEdits(defaultRecipe))

    act(() => {
      result.current.initializeImages(['a'])
      result.current.patchImage('a', { filterPresetId: 'noir' })
    })

    expect(result.current.recipesById['a'].present.recipe.filterPresetId).toBe('noir')
  })
})

describe('useImageEdits history', () => {
  it('seeds an Original entry on initialize', () => {
    const { result } = renderHook(() => useImageEdits(defaultRecipe))

    act(() => {
      result.current.initializeImages(['a'])
    })

    const timeline = result.current.getTimeline('a')
    expect(timeline?.entries).toHaveLength(1)
    expect(timeline?.entries[0].label).toBe('Original')
    expect(timeline?.entries[0].recipe).toEqual(defaultRecipe)
    expect(timeline?.currentIndex).toBe(0)
  })

  it('returns undefined timeline for unknown ids', () => {
    const { result } = renderHook(() => useImageEdits(defaultRecipe))

    expect(result.current.getTimeline('unknown')).toBeUndefined()
  })

  it('records a commit entry with a derived label', () => {
    const { result } = renderHook(() => useImageEdits(defaultRecipe))

    act(() => {
      result.current.initializeImages(['a'])
      result.current.patchImage('a', { imageEdgePixels: 920 })
    })

    const timeline = result.current.getTimeline('a')
    expect(timeline?.entries).toHaveLength(2)
    expect(timeline?.entries[1].label).toBe('Edge size: 920px')
    expect(timeline?.entries[1].recipe.imageEdgePixels).toBe(920)
    expect(timeline?.currentIndex).toBe(1)
  })

  it('records an explicit label when provided', () => {
    const { result } = renderHook(() => useImageEdits(defaultRecipe))

    act(() => {
      result.current.initializeImages(['a'])
      result.current.patchImage('a', { filterPresetId: 'ember' }, 'Bulk change')
    })

    expect(result.current.getTimeline('a')?.entries[1].label).toBe('Bulk change')
  })

  it('does not record a no-op commit', () => {
    const { result } = renderHook(() => useImageEdits(defaultRecipe))

    act(() => {
      result.current.initializeImages(['a'])
      result.current.patchImage('a', { backgroundColor: '#ffffff' }) // same as default
    })

    expect(result.current.getTimeline('a')?.entries).toHaveLength(1)
  })

  it('live patches update the recipe but not the history', () => {
    const { result } = renderHook(() => useImageEdits(defaultRecipe))

    act(() => {
      result.current.initializeImages(['a'])
      result.current.patchImageLive('a', { imageEdgePixels: 920 })
      result.current.patchImageLive('a', { imageEdgePixels: 930 })
    })

    expect(result.current.getRecipe('a').imageEdgePixels).toBe(930)
    expect(result.current.getTimeline('a')?.entries).toHaveLength(1)
  })

  it('records exactly one entry when a gesture commits after live patches', () => {
    const { result } = renderHook(() => useImageEdits(defaultRecipe))

    act(() => {
      result.current.initializeImages(['a'])
      result.current.patchImageLive('a', { imageEdgePixels: 910 })
      result.current.patchImageLive('a', { imageEdgePixels: 920 })
      result.current.patchImage('a', { imageEdgePixels: 920 })
    })

    const timeline = result.current.getTimeline('a')
    expect(timeline?.entries).toHaveLength(2)
    expect(timeline?.entries[1].recipe.imageEdgePixels).toBe(920)
    expect(timeline?.entries[1].label).toBe('Edge size: 920px')
    expect(result.current.getRecipe('a').imageEdgePixels).toBe(920)
  })

  it('does not record a gesture that ends where it started', () => {
    const { result } = renderHook(() => useImageEdits(defaultRecipe))

    act(() => {
      result.current.initializeImages(['a'])
      result.current.patchImageLive('a', { imageEdgePixels: 920 })
      result.current.patchImageLive('a', { imageEdgePixels: 900 })
      result.current.patchImage('a', { imageEdgePixels: 900 })
    })

    expect(result.current.getTimeline('a')?.entries).toHaveLength(1)
    expect(result.current.getRecipe('a').imageEdgePixels).toBe(900)
  })

  it('undoes and redoes commits', () => {
    const { result } = renderHook(() => useImageEdits(defaultRecipe))

    act(() => {
      result.current.initializeImages(['a'])
      result.current.patchImage('a', { filterPresetId: 'ember' })
      result.current.patchImage('a', { borderWidthPixels: 120 })
    })

    expect(result.current.getRecipe('a').borderWidthPixels).toBe(120)

    act(() => {
      result.current.undo('a')
    })
    expect(result.current.getRecipe('a').borderWidthPixels).toBe(90)
    expect(result.current.getRecipe('a').filterPresetId).toBe('ember')

    act(() => {
      result.current.redo('a')
    })
    expect(result.current.getRecipe('a').borderWidthPixels).toBe(120)
  })

  it('undo at the start and redo at the end are no-ops', () => {
    const { result } = renderHook(() => useImageEdits(defaultRecipe))

    act(() => {
      result.current.initializeImages(['a'])
      result.current.undo('a')
    })
    expect(result.current.getTimeline('a')?.currentIndex).toBe(0)

    act(() => {
      result.current.patchImage('a', { filterPresetId: 'ember' })
      result.current.redo('a')
    })
    expect(result.current.getTimeline('a')?.currentIndex).toBe(1)
  })

  it('jumps to a past entry and keeps future entries', () => {
    const { result } = renderHook(() => useImageEdits(defaultRecipe))

    act(() => {
      result.current.initializeImages(['a'])
      result.current.patchImage('a', { filterPresetId: 'ember' })
      result.current.patchImage('a', { borderWidthPixels: 120 })
      result.current.jumpToIndex('a', 1)
    })

    const timeline = result.current.getTimeline('a')
    expect(timeline?.currentIndex).toBe(1)
    expect(result.current.getRecipe('a').filterPresetId).toBe('ember')
    expect(result.current.getRecipe('a').borderWidthPixels).toBe(90)
    expect(timeline?.entries).toHaveLength(3)
  })

  it('truncates future entries on the next commit after a jump', () => {
    const { result } = renderHook(() => useImageEdits(defaultRecipe))

    act(() => {
      result.current.initializeImages(['a'])
      result.current.patchImage('a', { filterPresetId: 'ember' })
      result.current.patchImage('a', { borderWidthPixels: 120 })
      result.current.jumpToIndex('a', 1)
      result.current.patchImage('a', { backgroundColor: '#000000' })
    })

    const timeline = result.current.getTimeline('a')
    expect(timeline?.entries).toHaveLength(3)
    expect(timeline?.entries[2].label).toBe('Background: #000000')
    expect(result.current.getRecipe('a').filterPresetId).toBe('ember')
    expect(result.current.getRecipe('a').borderWidthPixels).toBe(90)
  })

  it('records one history entry per image for a batch replace', () => {
    const { result } = renderHook(() => useImageEdits(defaultRecipe))

    act(() => {
      result.current.initializeImages(['a', 'b', 'c'])
      result.current.replaceImagesWithRecipe(['a', 'c'], emberRecipe, 'Apply to 2 images')
    })

    expect(result.current.getTimeline('a')?.entries).toHaveLength(2)
    expect(result.current.getTimeline('a')?.entries[1].label).toBe('Apply to 2 images')
    expect(result.current.getTimeline('c')?.entries).toHaveLength(2)
    expect(result.current.getTimeline('b')?.entries).toHaveLength(1)
  })

  it('drops history when an image is removed', () => {
    const { result } = renderHook(() => useImageEdits(defaultRecipe))

    act(() => {
      result.current.initializeImages(['a'])
      result.current.patchImage('a', { filterPresetId: 'ember' })
      result.current.removeImage('a')
    })

    expect(result.current.getTimeline('a')).toBeUndefined()
  })
})

describe('useImageEdits batch patches', () => {
  it('applies a shared patch to many images', () => {
    const { result } = renderHook(() => useImageEdits(defaultRecipe))

    act(() => {
      result.current.initializeImages(['a', 'b'])
      result.current.patchImages(['a', 'b'], { rotationDegrees: 90 })
    })

    expect(result.current.getRecipe('a').rotationDegrees).toBe(90)
    expect(result.current.getRecipe('b').rotationDegrees).toBe(90)
  })

  it('applies per-image patches via a factory and records one entry per image', () => {
    const { result } = renderHook(() => useImageEdits(defaultRecipe))

    act(() => {
      result.current.initializeImages(['a', 'b'])
      result.current.patchImage('a', { rotationDegrees: 90 })
      result.current.patchImages(
        ['a', 'b'],
        (recipe) => ({ rotationDegrees: (recipe.rotationDegrees + 90) % 360 }),
        'Rotate 2 images 90° CW',
      )
    })

    // 'a' rotates from its own 90° to 180°; 'b' from 0° to 90°
    expect(result.current.getRecipe('a').rotationDegrees).toBe(180)
    expect(result.current.getRecipe('b').rotationDegrees).toBe(90)
    expect(result.current.getTimeline('a')?.entries).toHaveLength(3)
    expect(result.current.getTimeline('a')?.entries[2].label).toBe('Rotate 2 images 90° CW')
    expect(result.current.getTimeline('b')?.entries[1].label).toBe('Rotate 2 images 90° CW')
  })

  it('skips images whose patch is a no-op', () => {
    const { result } = renderHook(() => useImageEdits(defaultRecipe))

    act(() => {
      result.current.initializeImages(['a', 'b'])
      result.current.patchImages(['a', 'b'], () => ({ rotationDegrees: 0 }))
    })

    expect(result.current.getTimeline('a')?.entries).toHaveLength(1)
    expect(result.current.getTimeline('b')?.entries).toHaveLength(1)
  })
})
