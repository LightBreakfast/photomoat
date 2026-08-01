import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { HistoryPanel } from '@/features/borders/components/HistoryPanel'
import { defaultImageRecipe } from '@/features/borders/defaultImageRecipe'
import type { EditHistoryEntry, EditTimeline } from '@/features/borders/types'

function entry(label: string, timestamp: number): EditHistoryEntry {
  return { recipe: defaultImageRecipe, label, timestamp }
}

function timeline(entries: EditHistoryEntry[], currentIndex: number): EditTimeline {
  return { entries, currentIndex }
}

function renderPanel(timeline: EditTimeline | undefined) {
  const onUndo = vi.fn()
  const onRedo = vi.fn()
  const onJump = vi.fn()

  const utils = render(
    <HistoryPanel
      timeline={timeline}
      onUndo={onUndo}
      onRedo={onRedo}
      onJump={onJump}
    />,
  )

  return { onUndo, onRedo, onJump, container: utils.container }
}

describe('HistoryPanel', () => {
  it('renders nothing when no image is selected', () => {
    const { container } = renderPanel(undefined)

    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when only the original entry exists', () => {
    const { container } = renderPanel(timeline([entry('Original', 1000)], 0))

    expect(container.firstChild).toBeNull()
  })

  it('renders entries newest first and highlights the current one', () => {
    renderPanel(
      timeline(
        [entry('Original', 1000), entry('Filter: Ember', 2000), entry('Border width: 120px', 3000)],
        2,
      ),
    )

    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Border width: 120px')
    expect(items[1]).toHaveTextContent('Filter: Ember')
    expect(items[2]).toHaveTextContent('Original')

    expect(screen.getByRole('button', { name: /border width: 120px/i })).toHaveAttribute(
      'aria-current',
      'true',
    )
    expect(screen.getByRole('button', { name: /filter: ember/i })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('enables undo and redo at an intermediate position', () => {
    renderPanel(
      timeline(
        [entry('Original', 1000), entry('Filter: Ember', 2000), entry('Border width: 120px', 3000)],
        1,
      ),
    )

    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Redo' })).toBeEnabled()
  })

  it('disables undo at the start', () => {
    renderPanel(timeline([entry('Original', 1000), entry('Filter: Ember', 2000)], 0))

    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Redo' })).toBeEnabled()
  })

  it('disables redo at the end', () => {
    renderPanel(timeline([entry('Original', 1000), entry('Filter: Ember', 2000)], 1))

    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled()
  })

  it('jumps when a past entry is clicked', () => {
    const { onJump } = renderPanel(
      timeline(
        [entry('Original', 1000), entry('Filter: Ember', 2000), entry('Border width: 120px', 3000)],
        2,
      ),
    )

    fireEvent.click(screen.getByRole('button', { name: /filter: ember/i }))
    expect(onJump).toHaveBeenCalledWith(1)

    fireEvent.click(screen.getByRole('button', { name: /original/i }))
    expect(onJump).toHaveBeenCalledWith(0)
  })

  it('jumps forward when a future entry is clicked', () => {
    const { onJump } = renderPanel(
      timeline(
        [entry('Original', 1000), entry('Filter: Ember', 2000), entry('Border width: 120px', 3000)],
        1,
      ),
    )

    fireEvent.click(screen.getByRole('button', { name: /border width: 120px/i }))
    expect(onJump).toHaveBeenCalledWith(2)
  })

  it('fires undo and redo via the header buttons', () => {
    const { onUndo, onRedo } = renderPanel(
      timeline(
        [entry('Original', 1000), entry('Filter: Ember', 2000), entry('Border width: 120px', 3000)],
        1,
      ),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(onUndo).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Redo' }))
    expect(onRedo).toHaveBeenCalledTimes(1)
  })
})
