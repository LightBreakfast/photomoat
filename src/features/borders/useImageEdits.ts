import { useCallback, useReducer } from 'react'

import type { ImageEditRecipe } from '@/features/borders/types'

// --- Actions ---

type ImageEditsAction =
  | { type: 'initialize-images'; imageIds: string[]; recipe: ImageEditRecipe }
  | { type: 'remove-image'; imageId: string }
  | { type: 'remove-images'; imageIds: string[] }
  | { type: 'patch-image'; imageId: string; patch: Partial<ImageEditRecipe> }
  | {
      type: 'replace-image-recipe'
      imageId: string
      recipe: ImageEditRecipe
    }
  | {
      type: 'replace-images-with-recipe'
      imageIds: string[]
      recipe: ImageEditRecipe
    }

// --- State ---

export type ImageEditsState = {
  byId: Record<string, ImageEditRecipe>
}

function reducer(state: ImageEditsState, action: ImageEditsAction): ImageEditsState {
  switch (action.type) {
    case 'initialize-images': {
      const next = { ...state.byId }
      for (const id of action.imageIds) {
        if (!next[id]) {
          next[id] = { ...action.recipe }
        }
      }
      return { byId: next }
    }

    case 'remove-image': {
      if (!state.byId[action.imageId]) {
        return state
      }
      const next = { ...state.byId }
      delete next[action.imageId]
      return { byId: next }
    }

    case 'remove-images': {
      const ids = new Set(action.imageIds)
      let changed = false
      const next: Record<string, ImageEditRecipe> = {}

      for (const [id, recipe] of Object.entries(state.byId)) {
        if (ids.has(id)) {
          changed = true
          continue
        }
        next[id] = recipe
      }

      return changed ? { byId: next } : state
    }

    case 'patch-image': {
      const existing = state.byId[action.imageId]
      if (!existing) {
        return state
      }
      return {
        byId: {
          ...state.byId,
          [action.imageId]: { ...existing, ...action.patch },
        },
      }
    }

    case 'replace-image-recipe': {
      return {
        byId: {
          ...state.byId,
          [action.imageId]: { ...action.recipe },
        },
      }
    }

    case 'replace-images-with-recipe': {
      const next = { ...state.byId }
      for (const id of action.imageIds) {
        next[id] = { ...action.recipe }
      }
      return { byId: next }
    }
  }
}

// --- Hook ---

export function useImageEdits(initialRecipe: ImageEditRecipe) {
  const [state, dispatch] = useReducer(reducer, { byId: {} })

  const initializeImages = useCallback(
    (imageIds: string[]) => {
      dispatch({ type: 'initialize-images', imageIds, recipe: initialRecipe })
    },
    [initialRecipe],
  )

  const removeImage = useCallback((imageId: string) => {
    dispatch({ type: 'remove-image', imageId })
  }, [])

  const removeImages = useCallback((imageIds: string[]) => {
    dispatch({ type: 'remove-images', imageIds })
  }, [])

  const patchImage = useCallback(
    (imageId: string, patch: Partial<ImageEditRecipe>) => {
      dispatch({ type: 'patch-image', imageId, patch })
    },
    [],
  )

  const replaceImageRecipe = useCallback(
    (imageId: string, recipe: ImageEditRecipe) => {
      dispatch({ type: 'replace-image-recipe', imageId, recipe })
    },
    [],
  )

  const replaceImagesWithRecipe = useCallback(
    (imageIds: string[], recipe: ImageEditRecipe) => {
      dispatch({ type: 'replace-images-with-recipe', imageIds, recipe })
    },
    [],
  )

  const getRecipe = useCallback(
    (imageId: string): ImageEditRecipe => {
      return state.byId[imageId] ?? initialRecipe
    },
    [state.byId, initialRecipe],
  )

  return {
    recipesById: state.byId,
    initializeImages,
    removeImage,
    removeImages,
    patchImage,
    replaceImageRecipe,
    replaceImagesWithRecipe,
    getRecipe,
  }
}
