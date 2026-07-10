import type { FilterAdjustments, ImageSizingMode } from '@/features/borders/types'
import type { ImageQueueItem, OutputPreset } from '@/shared/types'
import { ImageGrid } from '@/shared/components/ImageGrid'

type BrowseWorkspaceProps = {
  items: ImageQueueItem[]
  preset: OutputPreset
  backgroundColor: string
  sizingMode: ImageSizingMode
  edgePixels: number
  borderWidthPixels: number
  filterAdjustments?: FilterAdjustments
  columns?: number
  activeDownloadId?: string | null
  selectedIds?: Set<string>
  onRemove: (id: string) => void
  onDownload: (item: ImageQueueItem) => void | Promise<void>
  onInspect: (index: number) => void
  onToggleSelect?: (id: string, event: { metaKey: boolean; ctrlKey: boolean }) => void
}

export function BrowseWorkspace({
  items,
  preset,
  backgroundColor,
  sizingMode,
  edgePixels,
  borderWidthPixels,
  filterAdjustments,
  columns = 3,
  activeDownloadId,
  selectedIds,
  onRemove,
  onDownload,
  onInspect,
  onToggleSelect,
}: BrowseWorkspaceProps) {
  return (
    <ImageGrid
      items={items}
      preset={preset}
      backgroundColor={backgroundColor}
      sizingMode={sizingMode}
      edgePixels={edgePixels}
      borderWidthPixels={borderWidthPixels}
      filterAdjustments={filterAdjustments}
      columns={columns}
      activeDownloadId={activeDownloadId}
      selectedIds={selectedIds}
      onRemove={onRemove}
      onDownload={onDownload}
      onInspect={onInspect}
      onToggleSelect={onToggleSelect}
    />
  )
}
