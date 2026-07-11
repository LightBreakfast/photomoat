import type { FilterAdjustments, ImageEditRecipe } from '@/features/borders/types'
import { getPresetById } from '@/features/borders/presets'
import type { ImageQueueItem } from '@/shared/types'
import { ImageCard, type CardMenuAction } from '@/shared/components/ImageCard'

type ImageGridProps = {
  items: ImageQueueItem[]
  getItemRecipe: (id: string) => ImageEditRecipe
  getItemFilterAdjustments: (id: string) => FilterAdjustments
  getItemMenuActions?: (id: string) => CardMenuAction[]
  columns?: number
  activeDownloadId?: string | null
  selectedIds?: Set<string>
  onRemove: (id: string) => void
  onDownload: (item: ImageQueueItem) => void | Promise<void>
  onInspect?: (index: number) => void
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
}: ImageGridProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className={`grid items-start gap-3 ${columnClasses[columns] ?? columnClasses[3]}`}>
      {items.map((item, index) => {
        const recipe = getItemRecipe(item.id)
        const preset = getPresetById(recipe.presetId, recipe.customWidth, recipe.customHeight)
        const filterAdjustments = getItemFilterAdjustments(item.id)
        const menuActions = getItemMenuActions?.(item.id)

        return (
          <ImageCard
            key={item.id}
            item={item}
            preset={preset}
            backgroundColor={recipe.backgroundColor}
            sizingMode={recipe.imageSizingMode}
            edgePixels={recipe.imageEdgePixels}
            borderWidthPixels={recipe.borderWidthPixels}
            filterAdjustments={filterAdjustments}
            isDownloading={activeDownloadId === item.id}
            isSelected={selectedIds?.has(item.id)}
            menuActions={menuActions}
            onRemove={() => onRemove(item.id)}
            onDownload={() => onDownload(item)}
            onInspect={onInspect ? () => onInspect(index) : undefined}
            onToggleSelect={onToggleSelect ? (event) => onToggleSelect(item.id, event) : undefined}
          />
        )
      })}
    </div>
  )
}
