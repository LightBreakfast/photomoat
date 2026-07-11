import { Check, Download, Maximize2, MoreHorizontal, Trash2 } from 'lucide-react'
import type { FilterAdjustments, ImageSizingMode } from '@/features/borders/types'
import type { ImageQueueItem, OutputPreset } from '@/shared/types'
import { PreviewCanvas } from '@/shared/components/PreviewCanvas'
import { Tooltip } from '@/shared/components/Tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type CardMenuAction = {
  label: string
  icon?: React.ReactNode
  disabled?: boolean
  onClick: () => void
}

type ImageCardProps = {
  item: ImageQueueItem
  preset: OutputPreset
  backgroundColor: string
  sizingMode: ImageSizingMode
  edgePixels: number
  borderWidthPixels: number
  minVerticalPaddingPixels: number
  filterAdjustments?: FilterAdjustments
  isDownloading?: boolean
  isSelected?: boolean
  menuActions?: CardMenuAction[]
  onRemove: () => void
  onDownload: () => void | Promise<void>
  onInspect?: () => void
  onToggleSelect?: (event: { metaKey: boolean; ctrlKey: boolean }) => void
}

export function ImageCard({
  item,
  preset,
  backgroundColor,
  sizingMode,
  edgePixels,
  borderWidthPixels,
  minVerticalPaddingPixels,
  filterAdjustments,
  isDownloading = false,
  isSelected = false,
  menuActions,
  onRemove,
  onDownload,
  onInspect,
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

  const hasMenuActions = menuActions && menuActions.length > 0

  return (
    <article
      className={[
        'self-start flex flex-col border bg-surface',
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
            <div
              onClick={handlePreviewClick}
              className="aspect-square cursor-pointer overflow-hidden bg-surface-muted"
            >
              <PreviewCanvas
                sourceUrl={item.objectUrl}
                preset={preset}
                backgroundColor={backgroundColor}
                sizingMode={sizingMode}
                edgePixels={edgePixels}
                borderWidthPixels={borderWidthPixels}
                minVerticalPaddingPixels={minVerticalPaddingPixels}
                filterAdjustments={filterAdjustments}
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
                    : 'border-border bg-background/80 text-transparent opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
                ].join(' ')}
                aria-label={isSelected ? `Deselect ${item.filename}` : `Select ${item.filename}`}
              >
                <Check size={12} />
              </button>
            ) : null}

            {/* Top-right action buttons */}
            <div className="absolute right-2 top-2 flex items-center gap-1">
              {/* Inspect button */}
              {onInspect ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onInspect()
                  }}
                  className={[
                    'flex h-7 w-7 items-center justify-center rounded-md bg-background/80 text-muted transition-opacity',
                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
                  ].join(' ')}
                  aria-label={`Inspect ${item.filename}`}
                >
                  <Maximize2 size={14} />
                </button>
              ) : null}

              {/* Context menu */}
              {hasMenuActions ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        className={[
                          'flex h-7 w-7 items-center justify-center rounded-md bg-background/80 text-muted transition-opacity',
                          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
                        ].join(' ')}
                        aria-label={`More actions for ${item.filename}`}
                      />
                    }
                  >
                    <MoreHorizontal size={14} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="end" sideOffset={4}>
                    {menuActions.map((action, index) => (
                      <DropdownMenuItem
                        key={index}
                        disabled={action.disabled}
                        onClick={action.onClick}
                      >
                        {action.icon}
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
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
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
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
