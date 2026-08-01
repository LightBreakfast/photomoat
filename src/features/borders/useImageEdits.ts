import { useCallback, useReducer } from 'react'

import { describeChange, describeRecipe } from '@/features/borders/historyLabels'
import type {
  EditHistoryEntry,
  EditTimeline,
  ImageEditRecipe,
  ImageHistory,
} from '@/features/borders/types'

// --- Actions ---

type ImageEditsAction =
  | { type: 'initialize-images'; imageIds: string[]; recipe: ImageEditRecipe }
  | { type: 'remove-image'; imageId: string }
  | { type: 'remove-images'; imageIds: string[] }
  | { type: 'commit-patch'; imageId: string; patch: Partial<ImageEditRecipe>; label?: string }
  | { type: 'commit-replace'; imageId: string; recipe: ImageEditRecipe; label?: string }
  | { type: 'commit-replace-many'; imageIds: string[]; recipe: ImageEditRecipe; label?: string }
  | { type: 'live-patch'; imageId: string; patch: Partial<ImageEditRecipe> }
  | { type: 'undo'; imageId: string }
  | { type: 'redo'; imageId: string }
  | { type: 'jump-to'; imageId: string; index: number }

// --- State ---

export type ImageEditsState = {
  byId: Record<string, ImageHistory>
}

function createEntry(recipe: ImageEditRecipe, label: string): EditHistoryEntry {
  return { recipe: { ...recipe }, label, timestamp: Date.now() }
}

function recipesEqual(a: ImageEditRecipe, b: ImageEditRecipe): boolean {
  // Keep in sync with ImageEditRecipe: if a field is added there, it must be
  // compared here or the no-op guard will record empty history entries.
  return (
    a.presetId === b.presetId &&
    a.backgroundColor === b.backgroundColor &&
    a.imageSizingMode === b.imageSizingMode &&
    a.imageEdgePixels === b.imageEdgePixels &&
    a.borderWidthPixels === b.borderWidthPixels &&
    a.minVerticalPaddingPixels === b.minVerticalPaddingPixels &&
    a.customWidth === b.customWidth &&
    a.customHeight === b.customHeight &&
    a.filterPresetId === b.filterPresetId
  )
}

/**
 * Commit a new recipe for one image. Pushes the current present into `past`,
 * truncates `future`, and drops any live overlay. Returns the same reference
 * when the recipe is unchanged (no-op gesture) so callers can skip re-renders.
 */
function commitRecipe(
  history: ImageHistory,
  recipe: ImageEditRecipe,
  label: string,
): ImageHistory {
  if (recipesEqual(history.present.recipe, recipe)) {
    return history.working ? { ...history, working: undefined } : history
  }
  return {
    past: [...history.past, history.present],
    present: createEntry(recipe, label),
    future: [],
    working: undefined,
  }
}

function reducer(state: ImageEditsState, action: ImageEditsAction): ImageEditsState {
  switch (action.type) {
    case 'initialize-images': {
      const next = { ...state.byId }
      for (const id of action.imageIds) {
        if (!next[id]) {
          next[id] = {
            past: [],
            present: createEntry(action.recipe, 'Original'),
            future: [],
          }
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
      const next: Record<string, ImageHistory> = {}

      for (const [id, history] of Object.entries(state.byId)) {
        if (ids.has(id)) {
          changed = true
          continue
        }
        next[id] = history
      }

      return changed ? { byId: next } : state
    }

    case 'commit-patch': {
      const history = state.byId[action.imageId]
      if (!history) {
        return state
      }
      const recipe = { ...history.present.recipe, ...action.patch }
      const updated = commitRecipe(history, recipe, action.label ?? describeChange(action.patch))
      if (updated === history) {
        return state
      }
      return { byId: { ...state.byId, [action.imageId]: updated } }
    }

    case 'commit-replace': {
      const history = state.byId[action.imageId]
      if (!history) {
        return state
      }
      const updated = commitRecipe(
        history,
        action.recipe,
        action.label ?? describeRecipe(action.recipe),
      )
      if (updated === history) {
        return state
      }
      return { byId: { ...state.byId, [action.imageId]: updated } }
    }

    case 'commit-replace-many': {
      let changed = false
      const next = { ...state.byId }

      for (const id of action.imageIds) {
        const history = next[id]
        if (!history) {
          continue
        }
        const updated = commitRecipe(
          history,
          action.recipe,
          action.label ?? describeRecipe(action.recipe),
        )
        if (updated !== history) {
          next[id] = updated
          changed = true
        }
      }

      return changed ? { byId: next } : state
    }

    case 'live-patch': {
      const history = state.byId[action.imageId]
      if (!history) {
        return state
      }
      return {
        byId: {
          ...state.byId,
          [action.imageId]: {
            ...history,
            working: { ...history.working, ...action.patch },
          },
        },
      }
    }

    case 'undo': {
      const history = state.byId[action.imageId]
      if (!history || history.past.length === 0) {
        return state
      }
      const present = history.past[history.past.length - 1]
      return {
        byId: {
          ...state.byId,
          [action.imageId]: {
            past: history.past.slice(0, -1),
            present,
            future: [history.present, ...history.future],
            working: undefined,
          },
        },
      }
    }

    case 'redo': {
      const history = state.byId[action.imageId]
      if (!history || history.future.length === 0) {
        return state
      }
      const [present, ...future] = history.future
      return {
        byId: {
          ...state.byId,
          [action.imageId]: {
            past: [...history.past, history.present],
            present,
            future,
            working: undefined,
          },
        },
      }
    }

    case 'jump-to': {
      const history = state.byId[action.imageId]
      if (!history) {
        return state
      }
      const entries = [...history.past, history.present, ...history.future]
      const index = action.index
      if (index < 0 || index >= entries.length || index === history.past.length) {
        return state
      }
      return {
        byId: {
          ...state.byId,
          [action.imageId]: {
            past: entries.slice(0, index),
            present: entries[index],
            future: entries.slice(index + 1),
            working: undefined,
          },
        },
      }
    }
  }
}

// --- Hook ---

/**
 * Per-image edit state with undo/redo.
 *
 * Each image id maps to an ImageHistory: a stack of committed recipe snapshots
 * (past / present / future) plus an optional `working` overlay for live
 * previews mid-gesture. `getRecipe` merges the overlay so consumers see the
 * current preview, but only `patchImage` / `replaceImagesWithRecipe` / batch
 * ops record history; `patchImageLive` is transient and never committed.
 *
 * `removeImage` / `replaceImageRecipe` / `recipesById` are kept as forward-
 * looking API (copy/paste, reset) and are currently used by tests only.
 */
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

  /** Commit a change, recording a history entry. Use for discrete controls. */
  const patchImage = useCallback(
    (imageId: string, patch: Partial<ImageEditRecipe>, label?: string) => {
      dispatch({ type: 'commit-patch', imageId, patch, label })
    },
    [],
  )

  /** Apply a transient change without recording history. Use during gestures. */
  const patchImageLive = useCallback((imageId: string, patch: Partial<ImageEditRecipe>) => {
    dispatch({ type: 'live-patch', imageId, patch })
  }, [])

  const replaceImageRecipe = useCallback(
    (imageId: string, recipe: ImageEditRecipe, label?: string) => {
      dispatch({ type: 'commit-replace', imageId, recipe, label })
    },
    [],
  )

  const replaceImagesWithRecipe = useCallback(
    (imageIds: string[], recipe: ImageEditRecipe, label?: string) => {
      dispatch({ type: 'commit-replace-many', imageIds, recipe, label })
    },
    [],
  )

  const undo = useCallback((imageId: string) => {
    dispatch({ type: 'undo', imageId })
  }, [])

  const redo = useCallback((imageId: string) => {
    dispatch({ type: 'redo', imageId })
  }, [])

  const jumpToIndex = useCallback((imageId: string, index: number) => {
    dispatch({ type: 'jump-to', imageId, index })
  }, [])

  const getRecipe = useCallback(
    (imageId: string): ImageEditRecipe => {
      const history = state.byId[imageId]
      if (!history) {
        return initialRecipe
      }
      return history.working
        ? { ...history.present.recipe, ...history.working }
        : history.present.recipe
    },
    [state.byId, initialRecipe],
  )

  const getTimeline = useCallback(
    (imageId: string): EditTimeline | undefined => {
      const history = state.byId[imageId]
      if (!history) {
        return undefined
      }
      return {
        entries: [...history.past, history.present, ...history.future],
        currentIndex: history.past.length,
      }
    },
    [state.byId],
  )

  return {
    recipesById: state.byId,
    initializeImages,
    removeImage,
    removeImages,
    patchImage,
    patchImageLive,
    replaceImageRecipe,
    replaceImagesWithRecipe,
    undo,
    redo,
    jumpToIndex,
    getRecipe,
    getTimeline,
  }
}
