import { renderHook } from '@testing-library/react'
import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { useImageQueue } from '@/shared/hooks/useImageQueue'

const jpgFile = new File(['jpg'], 'portrait.jpg', { type: 'image/jpeg' })
const pngFile = new File(['png'], 'square.png', { type: 'image/png' })
const pdfFile = new File(['pdf'], 'notes.pdf', { type: 'application/pdf' })

describe('useImageQueue', () => {
  it('adds, removes, and clears items', async () => {
    const loadDimensions = vi
      .fn()
      .mockResolvedValueOnce({ width: 1200, height: 800 })
      .mockResolvedValueOnce({ width: 900, height: 900 })
    const revokeObjectUrl = vi.fn()

    const { result } = renderHook(() =>
      useImageQueue({
        loadDimensions,
        createObjectUrl: (file) => `blob:${file.name}`,
        revokeObjectUrl,
      }),
    )

    await act(async () => {
      await result.current.addFiles([jpgFile, pngFile])
    })

    expect(result.current.items).toHaveLength(2)
    expect(result.current.items[0]).toMatchObject({
      filename: 'portrait.jpg',
      status: 'ready',
      originalWidth: 1200,
      originalHeight: 800,
    })

    const firstItemId = result.current.items[0].id

    act(() => {
      result.current.removeItem(firstItemId)
    })

    expect(result.current.items).toHaveLength(1)
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:portrait.jpg')

    act(() => {
      result.current.clearItems()
    })

    expect(result.current.items).toHaveLength(0)
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:square.png')
  })

  it('skips duplicates and reports invalid file types', async () => {
    const { result } = renderHook(() =>
      useImageQueue({
        loadDimensions: vi.fn().mockResolvedValue({ width: 1000, height: 1000 }),
        createObjectUrl: (file) => `blob:${file.name}`,
        revokeObjectUrl: vi.fn(),
      }),
    )

    await act(async () => {
      await result.current.addFiles([jpgFile])
      await result.current.addFiles([jpgFile, pdfFile])
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.message).toBe('This file type is not supported. Please use JPG or PNG.')
  })

  it('does not revoke object URLs during normal rerenders', async () => {
    const revokeObjectUrl = vi.fn()

    const { result } = renderHook(() =>
      useImageQueue({
        loadDimensions: vi.fn().mockResolvedValue({ width: 1000, height: 1000 }),
        createObjectUrl: (file) => `blob:${file.name}`,
        revokeObjectUrl,
      }),
    )

    await act(async () => {
      await result.current.addFiles([jpgFile])
    })

    expect(result.current.items).toHaveLength(1)
    expect(revokeObjectUrl).not.toHaveBeenCalled()
  })

  it('tracks error status when dimensions fail to load', async () => {
    const { result } = renderHook(() =>
      useImageQueue({
        loadDimensions: vi.fn().mockRejectedValue(new Error('bad image')),
        createObjectUrl: (file) => `blob:${file.name}`,
        revokeObjectUrl: vi.fn(),
      }),
    )

    await act(async () => {
      await result.current.addFiles([jpgFile])
    })

    expect(result.current.items[0]).toMatchObject({
      status: 'error',
      error: 'This image could not be loaded.',
    })
  })
})
