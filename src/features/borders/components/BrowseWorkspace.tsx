import type { FilterAdjustments, ImageEditRecipe } from '@/features/borders/types'
import type { CardMenuAction } from '@/shared/components/ImageCard'
import type { ImageQueueItem } from '@/shared/types'
import { ImageGrid } from '@/shared/components/ImageGrid'

type BrowseWorkspaceProps = {
  items: ImageQueueItem[]
  getItemRecipe: (id: string) => ImageEditRecipe
  getItemFilterAdjustments: (id: string) => FilterAdjustments
  getItemMenuActions?: (id: string) => CardMenuAction[]
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
  getItemRecipe,
  getItemFilterAdjustments,
  getItemMenuActions,
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
      getItemRecipe={getItemRecipe}
      getItemFilterAdjustments={getItemFilterAdjustments}
      getItemMenuActions={getItemMenuActions}
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
