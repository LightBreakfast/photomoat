import { renderHook } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useUndoRedoShortcuts } from '@/features/borders/useUndoRedoShortcuts'

function setup(targetId: string | null = 'a') {
  const onUndo = vi.fn()
  const onRedo = vi.fn()

  renderHook(() => useUndoRedoShortcuts({ targetId, onUndo, onRedo }))

  return { onUndo, onRedo }
}

function pressKey(key: string, options: { metaKey?: boolean; ctrlKey?: boolean; shiftKey?: boolean } = {}) {
  fireEvent.keyDown(window, { key, ...options })
}

describe('useUndoRedoShortcuts', () => {
  it('undoes on Cmd+Z', () => {
    const { onUndo, onRedo } = setup()

    pressKey('z', { metaKey: true })

    expect(onUndo).toHaveBeenCalledTimes(1)
    expect(onRedo).not.toHaveBeenCalled()
  })

  it('undoes on Ctrl+Z', () => {
    const { onUndo } = setup()

    pressKey('z', { ctrlKey: true })

    expect(onUndo).toHaveBeenCalledTimes(1)
  })

  it('redoes on Cmd+Shift+Z', () => {
    const { onUndo, onRedo } = setup()

    pressKey('z', { metaKey: true, shiftKey: true })

    expect(onRedo).toHaveBeenCalledTimes(1)
    expect(onUndo).not.toHaveBeenCalled()
  })

  it('redoes on Cmd+Y', () => {
    const { onRedo } = setup()

    pressKey('y', { metaKey: true })

    expect(onRedo).toHaveBeenCalledTimes(1)
  })

  it('ignores keys without a modifier', () => {
    const { onUndo, onRedo } = setup()

    pressKey('z')

    expect(onUndo).not.toHaveBeenCalled()
    expect(onRedo).not.toHaveBeenCalled()
  })

  it('ignores shortcuts when no target is selected', () => {
    const { onUndo, onRedo } = setup(null)

    pressKey('z', { metaKey: true })

    expect(onUndo).not.toHaveBeenCalled()
    expect(onRedo).not.toHaveBeenCalled()
  })

  it('ignores shortcuts while typing in an input', () => {
    const { onUndo, onRedo } = setup()

    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    try {
      fireEvent.keyDown(input, { key: 'z', metaKey: true })
      expect(onUndo).not.toHaveBeenCalled()
      expect(onRedo).not.toHaveBeenCalled()
    } finally {
      document.body.removeChild(input)
    }
  })

  it('prevents default browser undo', () => {
    setup()

    const event = new KeyboardEvent('keydown', { key: 'z', metaKey: true, bubbles: true })
    const preventDefault = vi.spyOn(event, 'preventDefault')
    window.dispatchEvent(event)

    expect(preventDefault).toHaveBeenCalled()
  })
})
