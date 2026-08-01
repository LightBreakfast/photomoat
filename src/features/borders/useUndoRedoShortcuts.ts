import { useEffect, useRef } from 'react'

type UseUndoRedoShortcutsOptions = {
  targetId: string | null
  onUndo: () => void
  onRedo: () => void
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  )
}

/**
 * Cmd/Ctrl+Z = undo, Cmd/Ctrl+Shift+Z and Cmd/Ctrl+Y = redo, applied to the
 * given edit target. Ignored while focus is in an editable element so typing
 * in text fields keeps native behaviour.
 */
export function useUndoRedoShortcuts({
  targetId,
  onUndo,
  onRedo,
}: UseUndoRedoShortcutsOptions) {
  const latestRef = useRef({ targetId, onUndo, onRedo })
  latestRef.current = { targetId, onUndo, onRedo }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { targetId, onUndo, onRedo } = latestRef.current
      if (!targetId || isEditableTarget(event.target)) {
        return
      }

      const hasModifier = event.metaKey || event.ctrlKey
      if (!hasModifier) {
        return
      }

      const key = event.key.toLowerCase()
      if (key === 'z') {
        event.preventDefault()
        if (event.shiftKey) {
          onRedo()
        } else {
          onUndo()
        }
      } else if (key === 'y') {
        event.preventDefault()
        onRedo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
