import type {
  FilterAdjustments,
  ImageSizingMode,
  InspectZoom,
} from '@/features/borders/types'
import type { ImageQueueItem, OutputPreset } from '@/shared/types'
import { PreviewCanvas } from '@/shared/components/PreviewCanvas'

type InspectWorkspaceProps = {
  item: ImageQueueItem | null
  preset: OutputPreset
  backgroundColor: string
  sizingMode: ImageSizingMode
  edgePixels: number
  borderWidthPixels: number
  minVerticalPaddingPixels: number
  filterAdjustments?: FilterAdjustments
  rotationDegrees?: number
  flipHorizontal?: boolean
  flipVertical?: boolean
  inspectZoom: InspectZoom
}

export function InspectWorkspace({
  item,
  preset,
  backgroundColor,
  sizingMode,
  edgePixels,
  borderWidthPixels,
  minVerticalPaddingPixels,
  filterAdjustments,
  rotationDegrees = 0,
  flipHorizontal = false,
  flipVertical = false,
  inspectZoom,
}: InspectWorkspaceProps) {
  if (!item) {
    return null
  }

  const isFitZoom = inspectZoom.mode === 'fit'
  const zoomPercent = inspectZoom.mode === 'percent' ? inspectZoom.percent : undefined

  return (
    <div
      className={
        isFitZoom
          ? 'flex flex-1 min-h-0 items-center justify-center overflow-hidden rounded-lg bg-surface-muted'
          : 'scrollbar-hover flex flex-1 min-h-0 overflow-auto rounded-lg bg-surface-muted'
      }
    >
      <div
        className={
          isFitZoom
            ? 'flex h-full w-full items-center justify-center p-3'
            : 'flex min-h-full min-w-full items-start justify-center p-3'
        }
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
          rotationDegrees={rotationDegrees}
          flipHorizontal={flipHorizontal}
          flipVertical={flipVertical}
          label={`Inspect: ${item.filename}`}
          fullSize
          zoomPercent={zoomPercent}
        />
      </div>
    </div>
  )
}
