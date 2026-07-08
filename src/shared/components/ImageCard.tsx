import { Check, Download, Maximize2, Trash2 } from 'lucide-react'
import type { ImageSizingMode } from '@/features/borders/types'
import type { ImageQueueItem, OutputPreset } from '@/shared/types'
import { PreviewCanvas } from '@/shared/components/PreviewCanvas'
import { Tooltip } from '@/shared/components/Tooltip'

type ImageCardProps = {
  item: ImageQueueItem
  preset: OutputPreset
  backgroundColor: string
  sizingMode: ImageSizingMode
  edgePixels: number
  borderWidthPixels: number
  isDownloading?: boolean
  isSelected?: boolean
  onRemove: () => void
  onDownload: () => void | Promise<void>
  onPreview?: () => void
  onToggleSelect?: (event: { metaKey: boolean; ctrlKey: boolean }) => void
}

export function ImageCard({
  item,
  preset,
  backgroundColor,
  sizingMode,
  edgePixels,
  borderWidthPixels,
  isDownloading = false,
  isSelected = false,
  onRemove,
  onDownload,
  onPreview,
  onToggleSelect,
}: ImageCardProps) {
  const dimensionsLabel =
    item.originalWidth && item.originalHeight
      ? `${item.originalWidth}×${item.originalHeight}`
      : null

  const handlePreviewClick = (event: React.MouseEvent) => {
    if (onToggleSelect) {
      onToggleSelect({ metaKey: event.metaKey, ctrlKey: event.ctrlKey })
    }
  }

  return (
    <article
      className={[
        'flex flex-col border bg-surface',
        isSelected ? 'border-accent' : 'border-border',
      ].join(' ')}
    >
      <div className="group relative overflow-hidden">
        {item.status === 'error' ? (
          <div className="flex aspect-square items-center justify-center bg-surface-muted p-4 text-sm text-danger">
            {item.error ?? 'Failed to load.'}
          </div>
        ) : (
          <>
            <div onClick={handlePreviewClick} className="cursor-pointer">
              <PreviewCanvas
                sourceUrl={item.objectUrl}
                preset={preset}
                backgroundColor={backgroundColor}
                sizingMode={sizingMode}
                edgePixels={edgePixels}
                borderWidthPixels={borderWidthPixels}
                label={`Preview for ${item.filename}`}
              />
            </div>

            {/* Selection checkbox */}
            {onToggleSelect ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onToggleSelect({ metaKey: event.metaKey, ctrlKey: event.ctrlKey })
                }}
                className={[
                  'absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded border transition-opacity',
                  isSelected
                    ? 'border-accent bg-accent text-accent-foreground opacity-100'
                    : 'border-border bg-background/80 text-transparent opacity-0 group-hover:opacity-100',
                ].join(' ')}
                aria-label={isSelected ? `Deselect ${item.filename}` : `Select ${item.filename}`}
              >
                <Check size={12} />
              </button>
            ) : null}

            {/* Expand button */}
            {onPreview ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onPreview()
                }}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md bg-background/80 text-muted opacity-0 transition-opacity group-hover:opacity-100"
                aria-label={`Expand preview for ${item.filename}`}
              >
                <Maximize2 size={14} />
              </button>
            ) : null}
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{item.filename}</p>
          {dimensionsLabel ? (
            <p className="text-xs text-muted">{dimensionsLabel}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
            <Tooltip label="Remove">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onRemove()
                }}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:text-foreground"
                aria-label={`Remove ${item.filename}`}
              >
                <Trash2 size={14} />
              </button>
            </Tooltip>
            <Tooltip label="Download">
              <button
                type="button"
                disabled={item.status !== 'ready' || isDownloading}
                onClick={(event) => {
                  event.stopPropagation()
                  void onDownload()
                }}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted disabled:cursor-not-allowed disabled:opacity-50 hover:text-foreground"
                aria-label={`Download ${item.filename}`}
              >
                {isDownloading ? (
                  <span className="text-xs">…</span>
                ) : (
                  <Download size={14} />
                )}
              </button>
            </Tooltip>
        </div>
      </div>
    </article>
  )
}
