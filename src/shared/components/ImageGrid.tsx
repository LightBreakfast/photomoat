import type { ImageSizingMode } from '@/features/borders/types'
import type { ImageQueueItem, OutputPreset } from '@/shared/types'
import { ImageCard } from '@/shared/components/ImageCard'

type ImageGridProps = {
  items: ImageQueueItem[]
  preset: OutputPreset
  backgroundColor: string
  sizingMode: ImageSizingMode
  edgePixels: number
  borderWidthPixels: number
  columns?: number
  activeDownloadId?: string | null
  selectedIds?: Set<string>
  onRemove: (id: string) => void
  onDownload: (item: ImageQueueItem) => void | Promise<void>
  onPreview?: (index: number) => void
  onToggleSelect?: (id: string, event: { metaKey: boolean; ctrlKey: boolean }) => void
}

const columnClasses: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
  6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
}

export function ImageGrid({
  items,
  preset,
  backgroundColor,
  sizingMode,
  edgePixels,
  borderWidthPixels,
  columns = 3,
  activeDownloadId,
  selectedIds,
  onRemove,
  onDownload,
  onPreview,
  onToggleSelect,
}: ImageGridProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className={`grid gap-3 ${columnClasses[columns] ?? columnClasses[3]}`}>
      {items.map((item, index) => (
        <ImageCard
          key={item.id}
          item={item}
          preset={preset}
          backgroundColor={backgroundColor}
          sizingMode={sizingMode}
          edgePixels={edgePixels}
          borderWidthPixels={borderWidthPixels}
          isDownloading={activeDownloadId === item.id}
          isSelected={selectedIds?.has(item.id)}
          onRemove={() => onRemove(item.id)}
          onDownload={() => onDownload(item)}
          onPreview={onPreview ? () => onPreview(index) : undefined}
          onToggleSelect={onToggleSelect ? (event) => onToggleSelect(item.id, event) : undefined}
        />
      ))}
    </div>
  )
}
