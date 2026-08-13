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

  it('persists each added file via persistImage', async () => {
    const persistImage = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useImageQueue({
        loadDimensions: vi.fn().mockResolvedValue({ width: 1000, height: 1000 }),
        createObjectUrl: (file) => `blob:${file.name}`,
        revokeObjectUrl: vi.fn(),
        persistImage,
      }),
    )

    await act(async () => {
      await result.current.addFiles([jpgFile, pngFile])
    })

    expect(persistImage).toHaveBeenCalledTimes(2)
    expect(persistImage).toHaveBeenCalledWith({
      id: result.current.items[0].id,
      file: jpgFile,
    })
    expect(persistImage).toHaveBeenCalledWith({
      id: result.current.items[1].id,
      file: pngFile,
    })
  })

  it('does not mark an image durable until its byte write completes', async () => {
    let resolvePersist!: (value: boolean) => void
    const persistImage = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolvePersist = resolve
        }),
    )
    const { result } = renderHook(() =>
      useImageQueue({
        loadDimensions: vi.fn().mockResolvedValue({ width: 1000, height: 1000 }),
        createObjectUrl: (file) => `blob:${file.name}`,
        revokeObjectUrl: vi.fn(),
        persistImage,
      }),
    )

    let addPromise!: Promise<unknown>
    await act(async () => {
      addPromise = result.current.addFiles([jpgFile])
      await Promise.resolve()
    })

    expect(result.current.items[0]).toMatchObject({ persisted: false })

    await act(async () => {
      resolvePersist(true)
      await addPromise
    })

    expect(result.current.items[0]).toMatchObject({ persisted: true })
  })

  it('reports persistence failures without failing the add', async () => {
    const persistImage = vi
      .fn()
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce(new Error('quota'))
    const { result } = renderHook(() =>
      useImageQueue({
        loadDimensions: vi.fn().mockResolvedValue({ width: 1000, height: 1000 }),
        createObjectUrl: (file) => `blob:${file.name}`,
        revokeObjectUrl: vi.fn(),
        persistImage,
      }),
    )

    await act(async () => {
      await result.current.addFiles([jpgFile, pngFile])
    })

    expect(result.current.items).toHaveLength(2)
    expect(result.current.message).toBe('Some images could not be saved for later.')
  })

  it('restores items with fresh object URLs and persisted metadata', async () => {
    const createObjectUrl = vi.fn((file: File) => `blob:${file.name}`)
    const loadDimensions = vi.fn()

    const { result } = renderHook(() =>
      useImageQueue({
        loadDimensions,
        createObjectUrl,
        revokeObjectUrl: vi.fn(),
      }),
    )

    const restoredFile = new File(['jpg'], 'portrait.jpg', { type: 'image/jpeg' })
    const loadFile = vi.fn().mockResolvedValue(restoredFile)

    await act(async () => {
      await result.current.restoreItems(
        [
          {
            id: 'img-1',
            filename: 'portrait.jpg',
            mimeType: 'image/jpeg',
            originalWidth: 1200,
            originalHeight: 800,
            status: 'ready',
          },
        ],
        loadFile,
      )
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0]).toMatchObject({
      id: 'img-1',
      filename: 'portrait.jpg',
      objectUrl: 'blob:portrait.jpg',
      status: 'ready',
      originalWidth: 1200,
      originalHeight: 800,
    })
    expect(createObjectUrl).toHaveBeenCalledWith(restoredFile)
    expect(loadDimensions).not.toHaveBeenCalled()
  })

  it('recomputes missing dimensions during restore', async () => {
    const loadDimensions = vi.fn().mockResolvedValue({ width: 640, height: 480 })
    const { result } = renderHook(() =>
      useImageQueue({
        loadDimensions,
        createObjectUrl: (file) => `blob:${file.name}`,
        revokeObjectUrl: vi.fn(),
      }),
    )

    await act(async () => {
      await result.current.restoreItems(
        [
          {
            id: 'img-2',
            filename: 'square.png',
            mimeType: 'image/png',
            status: 'ready',
          },
        ],
        () => Promise.resolve(new File(['png'], 'square.png', { type: 'image/png' })),
      )
    })

    expect(result.current.items[0]).toMatchObject({
      status: 'ready',
      originalWidth: 640,
      originalHeight: 480,
    })
  })

  it('marks items with missing file data as errors', async () => {
    const { result } = renderHook(() =>
      useImageQueue({
        loadDimensions: vi.fn().mockResolvedValue({ width: 1000, height: 1000 }),
        createObjectUrl: (file) => `blob:${file.name}`,
        revokeObjectUrl: vi.fn(),
      }),
    )

    await act(async () => {
      await result.current.restoreItems(
        [
          {
            id: 'img-3',
            filename: 'gone.jpg',
            mimeType: 'image/jpeg',
            status: 'error',
          },
        ],
        () => Promise.resolve(null),
      )
    })

    expect(result.current.items[0]).toMatchObject({
      id: 'img-3',
      status: 'error',
      error: 'Saved image data is no longer available.',
    })
  })

  it('restores error items with intact source data as ready', async () => {
    const { result } = renderHook(() =>
      useImageQueue({
        loadDimensions: vi.fn(),
        createObjectUrl: (file) => `blob:${file.name}`,
        revokeObjectUrl: vi.fn(),
      }),
    )

    const file = new File(['jpg'], 'portrait.jpg', { type: 'image/jpeg' })
    await act(async () => {
      await result.current.restoreItems(
        [
          {
            id: 'img-5',
            filename: 'portrait.jpg',
            mimeType: 'image/jpeg',
            originalWidth: 1200,
            originalHeight: 800,
            status: 'error',
            error: 'Export failed.',
          },
        ],
        () => Promise.resolve(file),
      )
    })

    expect(result.current.items[0]).toMatchObject({
      id: 'img-5',
      status: 'ready',
      error: undefined,
      originalWidth: 1200,
      originalHeight: 800,
    })
    expect(result.current.items[0].objectUrl).toBe('blob:portrait.jpg')
  })

  it('revokes replaced object URLs on idempotent restore', async () => {
    const revokeObjectUrl = vi.fn()
    let urlCounter = 0
    const { result } = renderHook(() =>
      useImageQueue({
        loadDimensions: vi.fn().mockResolvedValue({ width: 1000, height: 1000 }),
        createObjectUrl: () => `blob:unique-${urlCounter++}`,
        revokeObjectUrl,
      }),
    )

    const file = new File(['jpg'], 'portrait.jpg', { type: 'image/jpeg' })
    const record = {
      id: 'img-4',
      filename: 'portrait.jpg',
      mimeType: 'image/jpeg' as const,
      originalWidth: 1200,
      originalHeight: 800,
      status: 'ready' as const,
    }

    await act(async () => {
      await result.current.restoreItems([record], () => Promise.resolve(file))
    })

    const firstUrl = result.current.items[0].objectUrl
    await act(async () => {
      await result.current.restoreItems([record], () => Promise.resolve(file))
    })

    expect(revokeObjectUrl).toHaveBeenCalledWith(firstUrl)
    expect(result.current.items[0].objectUrl).not.toBe(firstUrl)
  })
})
