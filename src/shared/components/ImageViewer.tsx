import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

import type { FilterAdjustments, ImageSizingMode } from '@/features/borders/types'
import type { ImageQueueItem, OutputPreset } from '@/shared/types'
import { PreviewCanvas } from '@/shared/components/PreviewCanvas'

type ImageViewerProps = {
  items: ImageQueueItem[]
  currentIndex: number
  preset: OutputPreset
  backgroundColor: string
  sizingMode: ImageSizingMode
  edgePixels: number
  borderWidthPixels: number
  filterAdjustments?: FilterAdjustments
  isCompareActive?: boolean
  onCompareStart?: () => void
  onCompareEnd?: () => void
  onClose: () => void
  onNavigate: (index: number) => void
}

export function ImageViewer({
  items,
  currentIndex,
  preset,
  backgroundColor,
  sizingMode,
  edgePixels,
  borderWidthPixels,
  filterAdjustments,
  isCompareActive = false,
  onCompareStart,
  onCompareEnd,
  onClose,
  onNavigate,
}: ImageViewerProps) {
  const currentItem = items[currentIndex]
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < items.length - 1
  const containerRef = useRef<HTMLDivElement>(null)

  const goPrev = useCallback(() => {
    if (hasPrev) onNavigate(currentIndex - 1)
  }, [currentIndex, hasPrev, onNavigate])

  const goNext = useCallback(() => {
    if (hasNext) onNavigate(currentIndex + 1)
  }, [currentIndex, hasNext, onNavigate])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') goPrev()
      if (event.key === 'ArrowRight') goNext()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [goNext, goPrev, onClose])

  // Focus the container on mount so keyboard events work immediately
  useEffect(() => {
    containerRef.current?.focus()
  }, [])

  if (!currentItem) return null

  return createPortal(
    <div
      ref={containerRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex flex-col bg-background/95 outline-none"
    >
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between px-4">
        <p className="truncate text-sm text-foreground">{currentItem.filename}</p>
        <div className="flex items-center gap-3">
          {onCompareStart && onCompareEnd ? (
            <button
              type="button"
              aria-pressed={isCompareActive}
              onPointerDown={onCompareStart}
              onPointerUp={onCompareEnd}
              onPointerLeave={onCompareEnd}
              onPointerCancel={onCompareEnd}
              className={[
                'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                isCompareActive
                  ? 'border-accent bg-surface-muted text-foreground'
                  : 'border-border bg-surface text-muted hover:text-foreground active:bg-surface-muted',
              ].join(' ')}
            >
              Hold to compare
            </button>
          ) : null}
          <span className="text-xs tabular-nums text-muted">
            {currentIndex + 1} / {items.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center text-muted hover:text-foreground"
            aria-label="Close viewer"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Image area */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center p-4 md:p-8">
        {/* Previous button */}
        {hasPrev ? (
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-muted hover:text-foreground"
            aria-label="Previous image"
          >
            <ChevronLeft size={20} />
          </button>
        ) : null}

        {/* Image */}
        <div className="flex h-full w-full items-center justify-center rounded-lg bg-[hsl(220,10%,25%)] p-3">
          <PreviewCanvas
            sourceUrl={currentItem.objectUrl}
            preset={preset}
            backgroundColor={backgroundColor}
            sizingMode={sizingMode}
            edgePixels={edgePixels}
            borderWidthPixels={borderWidthPixels}
            filterAdjustments={filterAdjustments}
            label={`Full preview: ${currentItem.filename}`}
            fullSize
          />
        </div>

        {/* Next button */}
        {hasNext ? (
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-muted hover:text-foreground"
            aria-label="Next image"
          >
            <ChevronRight size={20} />
          </button>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
