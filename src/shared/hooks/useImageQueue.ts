import { useCallback, useEffect, useRef, useState } from 'react'

import type { ImageDimensions, ImageQueueItem } from '@/shared/types'
import { getImageDimensions } from '@/shared/utils/imageLoader'
import { partitionImageFiles } from '@/shared/utils/imageValidation'

type UseImageQueueOptions = {
  loadDimensions?: (file: File, objectUrl: string) => Promise<ImageDimensions>
  createObjectUrl?: (file: File) => string
  revokeObjectUrl?: (objectUrl: string) => void
}

const defaultCreateObjectUrl = (file: File) => URL.createObjectURL(file)
const defaultRevokeObjectUrl = (objectUrl: string) => URL.revokeObjectURL(objectUrl)

function createFileIdentity(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`
}

function buildId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `image-${Math.random().toString(36).slice(2, 11)}`
}

export function useImageQueue({
  loadDimensions = getImageDimensions,
  createObjectUrl = defaultCreateObjectUrl,
  revokeObjectUrl = defaultRevokeObjectUrl,
}: UseImageQueueOptions = {}) {
  const [items, setItems] = useState<ImageQueueItem[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const itemsRef = useRef(items)

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) {
        revokeObjectUrl(item.objectUrl)
      }
    }
  }, [revokeObjectUrl])

  const updateItem = useCallback(
    (id: string, updater: (item: ImageQueueItem) => ImageQueueItem) => {
      setItems((currentItems) =>
        currentItems.map((item) => (item.id === id ? updater(item) : item)),
      )
    },
    [],
  )

  const addFiles = useCallback(
    async (files: File[]) => {
      const { accepted, rejected } = partitionImageFiles(files)
      const existingIds = new Set(itemsRef.current.map((item) => createFileIdentity(item.file)))
      const uniqueFiles = accepted.filter((file) => !existingIds.has(createFileIdentity(file)))
      const duplicateCount = accepted.length - uniqueFiles.length

      if (rejected.length > 0) {
        setMessage('This file type is not supported. Please use JPG or PNG.')
      } else if (duplicateCount > 0) {
        setMessage(`${duplicateCount} duplicate file${duplicateCount > 1 ? 's were' : ' was'} skipped.`)
      } else {
        setMessage(null)
      }

      const queuedItems = uniqueFiles.map((file) => ({
        id: buildId(),
        file,
        objectUrl: createObjectUrl(file),
        filename: file.name,
        mimeType: (file.type === 'image/png' ? 'image/png' : 'image/jpeg') as
          | 'image/png'
          | 'image/jpeg',
        status: 'pending' as const,
      }))

      if (queuedItems.length === 0) {
        return [] as ImageQueueItem[]
      }

      itemsRef.current = [...itemsRef.current, ...queuedItems]
      setItems((currentItems) => [...currentItems, ...queuedItems])

      await Promise.all(
        queuedItems.map(async (item) => {
          try {
            const dimensions = await loadDimensions(item.file, item.objectUrl)
            updateItem(item.id, (currentItem) => ({
              ...currentItem,
              status: 'ready',
              originalWidth: dimensions.width,
              originalHeight: dimensions.height,
              error: undefined,
            }))
          } catch {
            updateItem(item.id, (currentItem) => ({
              ...currentItem,
              status: 'error',
              error: 'This image could not be loaded.',
            }))
          }
        }),
      )

      return queuedItems
    },
    [createObjectUrl, loadDimensions, updateItem],
  )

  const removeItem = useCallback(
    (id: string) => {
      setItems((currentItems) => {
        const itemToRemove = currentItems.find((item) => item.id === id)

        if (itemToRemove) {
          revokeObjectUrl(itemToRemove.objectUrl)
        }

        const nextItems = currentItems.filter((item) => item.id !== id)
        itemsRef.current = nextItems

        return nextItems
      })
    },
    [revokeObjectUrl],
  )

  const clearItems = useCallback(() => {
    setItems((currentItems) => {
      for (const item of currentItems) {
        revokeObjectUrl(item.objectUrl)
      }

      itemsRef.current = []

      return []
    })
  }, [revokeObjectUrl])

  const setItemStatus = useCallback(
    (id: string, status: ImageQueueItem['status'], error?: string) => {
      updateItem(id, (item) => ({ ...item, status, error }))
    },
    [updateItem],
  )

  return {
    items,
    message,
    addFiles,
    removeItem,
    clearItems,
    setItemStatus,
    setMessage,
  }
}
