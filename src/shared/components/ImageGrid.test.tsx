import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ImageGrid } from '@/shared/components/ImageGrid'
import type { ImageEditRecipe } from '@/features/borders/types'
import type { ImageQueueItem } from '@/shared/types'

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

const defaultFilterAdjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  grayscale: 0,
  sepia: 0,
  hueRotate: 0,
}

const getItemRecipe = () => defaultRecipe
const getItemFilterAdjustments = () => defaultFilterAdjustments

const item: ImageQueueItem = {
  id: '1',
  file: new File(['jpg'], 'portrait.jpg', { type: 'image/jpeg' }),
  objectUrl: 'blob:portrait.jpg',
  filename: 'portrait.jpg',
  mimeType: 'image/jpeg',
  originalWidth: 1000,
  originalHeight: 800,
  status: 'error',
  error: 'This image could not be loaded.',
}

describe('ImageGrid', () => {
  it('renders nothing when no items exist', () => {
    const { container } = render(
      <ImageGrid
        items={[]}
        getItemRecipe={getItemRecipe}
        getItemFilterAdjustments={getItemFilterAdjustments}
        onRemove={vi.fn()}
        onDownload={vi.fn()}
      />,
    )

    expect(container.innerHTML).toBe('')
  })

  it('renders queued items', () => {
    render(
      <ImageGrid
        items={[item]}
        getItemRecipe={getItemRecipe}
        getItemFilterAdjustments={getItemFilterAdjustments}
        onRemove={vi.fn()}
        onDownload={vi.fn()}
      />,
    )

    expect(screen.getByText('portrait.jpg')).toBeInTheDocument()
    expect(screen.getByText('This image could not be loaded.')).toBeInTheDocument()
  })

  it('aligns cards to the start so borders do not stretch to the tallest row', () => {
    const { container } = render(
      <ImageGrid
        items={[item]}
        getItemRecipe={getItemRecipe}
        getItemFilterAdjustments={getItemFilterAdjustments}
        onRemove={vi.fn()}
        onDownload={vi.fn()}
      />,
    )

    expect(container.firstChild).toHaveClass('items-start')
  })

  it('renders icon buttons with aria-labels', () => {
    render(
      <ImageGrid
        items={[
          {
            ...item,
            status: 'ready',
            error: undefined,
          },
        ]}
        getItemRecipe={getItemRecipe}
        getItemFilterAdjustments={getItemFilterAdjustments}
        onRemove={vi.fn()}
        onDownload={vi.fn()}
        onInspect={vi.fn()}
        onToggleSelect={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /remove portrait/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /download portrait/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /inspect portrait/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /select portrait/i })).toBeInTheDocument()
  })

  it('shows selected state on checkbox when isSelected is true', () => {
    render(
      <ImageGrid
        items={[
          {
            ...item,
            status: 'ready',
            error: undefined,
          },
        ]}
        getItemRecipe={getItemRecipe}
        getItemFilterAdjustments={getItemFilterAdjustments}
        selectedIds={new Set(['1'])}
        onRemove={vi.fn()}
        onDownload={vi.fn()}
        onToggleSelect={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /deselect portrait/i })).toBeInTheDocument()
  })

  it('calls onToggleSelect when checkbox is clicked', () => {
    const onToggleSelect = vi.fn()

    render(
      <ImageGrid
        items={[
          {
            ...item,
            status: 'ready',
            error: undefined,
          },
        ]}
        getItemRecipe={getItemRecipe}
        getItemFilterAdjustments={getItemFilterAdjustments}
        onRemove={vi.fn()}
        onDownload={vi.fn()}
        onToggleSelect={onToggleSelect}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /select portrait/i }))

    expect(onToggleSelect).toHaveBeenCalledWith('1', expect.objectContaining({ metaKey: false, ctrlKey: false }))
  })
})

describe('ImageGrid context menu', () => {
  it('opens the card context menu and fires a per-card transform action', async () => {
    const onRotate = vi.fn()

    render(
      <ImageGrid
        items={[{ ...item, status: 'ready', error: undefined }]}
        getItemRecipe={getItemRecipe}
        getItemFilterAdjustments={getItemFilterAdjustments}
        getItemMenuActions={() => [
          {
            label: 'Transform',
            items: [
              { label: 'Rotate 90° CW', onClick: onRotate },
              { label: 'Flip horizontal', onClick: vi.fn() },
            ],
          },
        ]}
        onRemove={vi.fn()}
        onDownload={vi.fn()}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: /more actions for portrait/i }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Rotate 90° CW' }))

    expect(onRotate).toHaveBeenCalledTimes(1)
  })

  it('shows flip state as checked menu items and fires on toggle', async () => {
    const onFlipVertical = vi.fn()

    render(
      <ImageGrid
        items={[{ ...item, status: 'ready', error: undefined }]}
        getItemRecipe={getItemRecipe}
        getItemFilterAdjustments={getItemFilterAdjustments}
        getItemMenuActions={() => [
          {
            label: 'Transform',
            items: [
              { label: 'Flip horizontal', checked: true, onClick: vi.fn() },
              { label: 'Flip vertical', checked: false, onClick: onFlipVertical },
            ],
          },
        ]}
        onRemove={vi.fn()}
        onDownload={vi.fn()}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: /more actions for portrait/i }))

    const flipHorizontal = await screen.findByRole('menuitemcheckbox', { name: 'Flip horizontal' })
    const flipVertical = screen.getByRole('menuitemcheckbox', { name: 'Flip vertical' })
    expect(flipHorizontal).toHaveAttribute('aria-checked', 'true')
    expect(flipVertical).toHaveAttribute('aria-checked', 'false')

    await userEvent.click(flipVertical)
    expect(onFlipVertical).toHaveBeenCalledTimes(1)
  })
})

