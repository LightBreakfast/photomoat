import { useEffect, useMemo, useState } from 'react'
import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Contrast,
  Grid3X3,
  Pencil,
  Settings,
  Square,
} from 'lucide-react'

import { BorderControls } from '@/features/borders/components/BorderControls'
import { BrowseWorkspace } from '@/features/borders/components/BrowseWorkspace'
import { FilterControls } from '@/features/borders/components/FilterControls'
import { InspectWorkspace } from '@/features/borders/components/InspectWorkspace'
import { PresetSelector } from '@/features/borders/components/PresetSelector'
import { WorkspaceFooterIconButton } from '@/features/borders/components/WorkspaceFooterIconButton'
import { WorkspaceModeToggle } from '@/features/borders/components/WorkspaceModeToggle'
import { resolveFilterAdjustments } from '@/features/borders/filterPresets'
import { getPresetById, instagramPresets } from '@/features/borders/presets'
import { renderProcessedCanvas } from '@/features/borders/processing/canvasProcessor'
import type { InspectZoom } from '@/features/borders/types'
import { useBorderSettings } from '@/features/borders/useBorderSettings'
import { Dropzone } from '@/shared/components/Dropzone'
import { ExportControls } from '@/shared/components/ExportControls'
import { useImageQueue } from '@/shared/hooks/useImageQueue'
import type { ImageQueueItem } from '@/shared/types'
import { canvasToBlob, downloadBlob } from '@/shared/utils/downloadBlob'
import { exportZip } from '@/shared/utils/exportZip'
import { createBorderedFilename } from '@/shared/utils/filename'

const inspectZoomOptions: { label: string; value: InspectZoom }[] = [
  { label: 'Fit', value: { mode: 'fit' } },
  { label: '50%', value: { mode: 'percent', percent: 50 } },
  { label: '100%', value: { mode: 'percent', percent: 100 } },
  { label: '200%', value: { mode: 'percent', percent: 200 } },
]

export function BorderToolPage() {
  const {
    settings,
    setPresetId,
    setBackgroundColor,
    setOutputFormat,
    setJpegQuality,
    setImageSizingMode,
    setImageEdgePixels,
    setBorderWidthPixels,
    setCustomWidth,
    setCustomHeight,
    setFilterPresetId,
  } = useBorderSettings()
  const { items, message, addFiles, removeItem, setItemStatus } =
    useImageQueue()

  const [workspaceMode, setWorkspaceMode] = useState<'browse' | 'inspect'>('browse')
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [inspectZoom, setInspectZoom] = useState<InspectZoom>({ mode: 'fit' })
  const [mobilePanel, setMobilePanel] = useState<'none' | 'left' | 'right'>('none')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [columns, setColumns] = useState(3)
  const [activeDownloadId, setActiveDownloadId] = useState<string | null>(null)
  const [progressMessage, setProgressMessage] = useState<string | null>(null)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [isCompareActive, setIsCompareActive] = useState(false)

  const readyItems = useMemo(
    () => items.filter((item) => item.status === 'ready'),
    [items],
  )

  const hasSelection = selectedIds.size > 0
  const exportItems = hasSelection
    ? readyItems.filter((item) => selectedIds.has(item.id))
    : readyItems

  const activeFilterAdjustments = useMemo(
    () => resolveFilterAdjustments(isCompareActive ? 'original' : settings.filterPresetId),
    [isCompareActive, settings.filterPresetId],
  )

  const exportFilterAdjustments = useMemo(
    () => resolveFilterAdjustments(settings.filterPresetId),
    [settings.filterPresetId],
  )

  const selectedPreset = useMemo(
    () => getPresetById(settings.presetId, settings.customWidth, settings.customHeight),
    [settings.presetId, settings.customWidth, settings.customHeight],
  )

  const activeInspectIndex = useMemo(
    () => items.findIndex((item) => item.id === activeItemId),
    [activeItemId, items],
  )

  const activeInspectItem = activeInspectIndex >= 0 ? items[activeInspectIndex] : null
  const canInspectPrevious = activeInspectIndex > 0
  const canInspectNext =
    activeInspectIndex >= 0 && activeInspectIndex < items.length - 1

  useEffect(() => {
    if (items.length === 0) {
      setWorkspaceMode('browse')
      setActiveItemId(null)
      setIsCompareActive(false)
      return
    }

    if (workspaceMode !== 'inspect') {
      return
    }

    if (activeItemId && items.some((item) => item.id === activeItemId)) {
      return
    }

    setActiveItemId(items[0].id)
  }, [activeItemId, items, workspaceMode])

  const handleToggleSelect = (
    id: string,
    event: { metaKey: boolean; ctrlKey: boolean },
  ) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const modifier = event.metaKey || event.ctrlKey

      if (modifier) {
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
      } else if (next.has(id) && next.size === 1) {
        next.clear()
      } else {
        next.clear()
        next.add(id)
      }

      return next
    })
  }

  const handleSelectAll = () => {
    setSelectedIds(new Set(readyItems.map((item) => item.id)))
  }

  const handleClearSelection = () => {
    setSelectedIds(new Set())
  }

  const handleRemoveItem = (id: string) => {
    removeItem(id)
    setSelectedIds((prev) => {
      if (!prev.has(id)) {
        return prev
      }

      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const createProcessedBlob = async (item: ImageQueueItem) => {
    const canvas = await renderProcessedCanvas({
      sourceUrl: item.objectUrl,
      targetWidth: selectedPreset.width,
      targetHeight: selectedPreset.height,
      backgroundColor: settings.backgroundColor,
      sizingMode: settings.imageSizingMode,
      edgePixels: settings.imageEdgePixels,
      borderWidthPixels: settings.borderWidthPixels,
      filterAdjustments: exportFilterAdjustments,
    })

    return canvasToBlob(canvas, settings.outputFormat, settings.jpegQuality)
  }

  const handleSingleDownload = async (item: ImageQueueItem) => {
    setActiveDownloadId(item.id)
    setItemStatus(item.id, 'processing')
    setProgressMessage(`Preparing ${item.filename}…`)

    try {
      const blob = await createProcessedBlob(item)
      downloadBlob(blob, createBorderedFilename(item.filename, settings.outputFormat))
      setItemStatus(item.id, 'ready')
      setProgressMessage(`${item.filename} downloaded.`)
    } catch {
      setItemStatus(item.id, 'error', 'Export failed.')
      setProgressMessage('Export failed.')
    } finally {
      setActiveDownloadId(null)
    }
  }

  const handleBatchExport = async () => {
    if (exportItems.length === 0) {
      setProgressMessage('No images to export.')
      return
    }

    setProgress({ current: 0, total: exportItems.length })
    setProgressMessage(
      `Preparing ${exportItems.length} image${exportItems.length > 1 ? 's' : ''}…`,
    )

    try {
      await exportZip({
        items: exportItems,
        zipFilename: 'photomoat-borders.zip',
        createEntry: async (item) => {
          setItemStatus(item.id, 'processing')

          try {
            const blob = await createProcessedBlob(item)
            setItemStatus(item.id, 'ready')

            return {
              filename: createBorderedFilename(item.filename, settings.outputFormat),
              blob,
            }
          } catch (error) {
            setItemStatus(item.id, 'error', 'Export failed.')
            throw error
          }
        },
        onProgress: ({ current, total, filename }) => {
          setProgress({ current, total })
          setProgressMessage(`${current}/${total}: ${filename}`)
        },
      })
      setProgressMessage('ZIP export complete.')
    } catch {
      setProgressMessage('Export failed.')
    } finally {
      setProgress(null)
    }
  }

  const handleCompareStart = () => {
    setIsCompareActive(true)
  }

  const handleCompareEnd = () => {
    setIsCompareActive(false)
  }

  const handleWorkspaceModeChange = (mode: 'browse' | 'inspect') => {
    if (mode === 'inspect') {
      const nextActiveId =
        activeItemId && items.some((item) => item.id === activeItemId)
          ? activeItemId
          : items[0]?.id ?? null

      setActiveItemId(nextActiveId)
      setInspectZoom({ mode: 'fit' })
    } else {
      handleCompareEnd()
    }

    setWorkspaceMode(mode)
  }

  const handleInspect = (index: number) => {
    const item = items[index]

    if (!item) {
      return
    }

    setActiveItemId(item.id)
    setInspectZoom({ mode: 'fit' })
    setWorkspaceMode('inspect')
    handleCompareEnd()
  }

  const handleInspectPrevious = () => {
    if (!canInspectPrevious) {
      return
    }

    setActiveItemId(items[activeInspectIndex - 1].id)
    handleCompareEnd()
  }

  const handleInspectNext = () => {
    if (!canInspectNext) {
      return
    }

    setActiveItemId(items[activeInspectIndex + 1].id)
    handleCompareEnd()
  }

  const footerStatus =
    message ??
    (workspaceMode === 'inspect' && activeInspectItem
      ? activeInspectItem.filename
      : hasSelection
        ? `${selectedIds.size} of ${items.length} selected`
        : items.length > 0
          ? `${items.length} image${items.length > 1 ? 's' : ''}`
          : 'Ready')

  const leftPanelContent = (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          Images
        </p>
        <Dropzone
          variant="compact"
          onFilesAccepted={async (files) => {
            await addFiles(files)
            setMobilePanel('none')
          }}
        />
      </div>
      <FilterControls
        selectedPresetId={settings.filterPresetId}
        onPresetChange={setFilterPresetId}
      />
    </div>
  )

  const rightPanelContent = (
    <div className="space-y-5">
      <PresetSelector
        instagramPresets={instagramPresets}
        selectedPresetId={settings.presetId}
        onChange={setPresetId}
        customWidth={settings.customWidth}
        customHeight={settings.customHeight}
        onCustomWidthChange={setCustomWidth}
        onCustomHeightChange={setCustomHeight}
      />

      <div className="space-y-3 border-t border-border pt-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          Border
        </p>
        <BorderControls
          backgroundColor={settings.backgroundColor}
          imageSizingMode={settings.imageSizingMode}
          imageEdgePixels={settings.imageEdgePixels}
          borderWidthPixels={settings.borderWidthPixels}
          onBackgroundColorChange={setBackgroundColor}
          onImageSizingModeChange={setImageSizingMode}
          onImageEdgePixelsChange={setImageEdgePixels}
          onBorderWidthPixelsChange={setBorderWidthPixels}
        />
      </div>

      {items.length > 0 ? (
        <div className="space-y-3 border-t border-border pt-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            Export
          </p>
          <ExportControls
            variant="batch"
            disabled={exportItems.length === 0}
            outputFormat={settings.outputFormat}
            jpegQuality={settings.jpegQuality}
            onOutputFormatChange={setOutputFormat}
            onJpegQualityChange={setJpegQuality}
            onBatchExport={handleBatchExport}
            progressMessage={progressMessage}
            progress={progress}
          />
        </div>
      ) : null}
    </div>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-border bg-surface p-3 md:block">
          {leftPanelContent}
        </aside>

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background p-4">
          <div className="mb-3 flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setMobilePanel('left')}
              className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-xs text-muted hover:text-foreground"
              aria-label="Open edit controls"
            >
              <Pencil size={16} />
              Edit
            </button>
            {items.length > 0 ? (
              <button
                type="button"
                onClick={() => setMobilePanel('right')}
                className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-xs text-muted hover:text-foreground"
                aria-label="Open output controls"
              >
                <Settings size={16} />
                Output
              </button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <Dropzone
                variant="full"
                onFilesAccepted={async (files) => {
                  await addFiles(files)
                }}
              />
            </div>
          ) : workspaceMode === 'browse' ? (
            <div className="flex flex-1 min-h-0 overflow-y-auto">
              <BrowseWorkspace
                items={items}
                preset={selectedPreset}
                backgroundColor={settings.backgroundColor}
                sizingMode={settings.imageSizingMode}
                edgePixels={settings.imageEdgePixels}
                borderWidthPixels={settings.borderWidthPixels}
                filterAdjustments={activeFilterAdjustments}
                columns={columns}
                activeDownloadId={activeDownloadId}
                selectedIds={selectedIds}
                onRemove={handleRemoveItem}
                onDownload={handleSingleDownload}
                onInspect={handleInspect}
                onToggleSelect={handleToggleSelect}
              />
            </div>
          ) : (
            <InspectWorkspace
              item={activeInspectItem}
              preset={selectedPreset}
              backgroundColor={settings.backgroundColor}
              sizingMode={settings.imageSizingMode}
              edgePixels={settings.imageEdgePixels}
              borderWidthPixels={settings.borderWidthPixels}
              filterAdjustments={activeFilterAdjustments}
              inspectZoom={inspectZoom}
            />
          )}
        </main>

        <aside className="hidden w-70 shrink-0 overflow-y-auto border-l border-border bg-surface p-3 md:block">
          {rightPanelContent}
        </aside>
      </div>

      {mobilePanel !== 'none' ? (
        <>
          <div
            className="sidebar-overlay"
            onClick={() => setMobilePanel('none')}
            aria-hidden="true"
          />
          {mobilePanel === 'left' ? (
            <div className="sidebar-panel sidebar-left p-3">
              {leftPanelContent}
            </div>
          ) : null}
          {mobilePanel === 'right' ? (
            <div className="sidebar-panel sidebar-right p-3">
              {rightPanelContent}
            </div>
          ) : null}
        </>
      ) : null}

      <footer
        aria-label="Workspace footer"
        className="grid h-12 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 border-t border-border bg-surface px-4"
      >
        <p className="min-w-0 truncate pr-2 text-xs text-muted">{footerStatus}</p>

        <div className="flex min-w-0 items-center justify-center gap-2">
          {workspaceMode === 'browse' && items.length > 0 ? (
            <>
              <WorkspaceFooterIconButton
                label="Original"
                icon={Contrast}
                pressed={isCompareActive}
                onPointerDown={handleCompareStart}
                onPointerUp={handleCompareEnd}
                onPointerLeave={handleCompareEnd}
                onPointerCancel={handleCompareEnd}
              />
              <div className="mx-1 h-3 w-px bg-border" />
              <WorkspaceFooterIconButton
                label="Select all"
                icon={CheckSquare}
                onClick={handleSelectAll}
              />
              <WorkspaceFooterIconButton
                label="Deselect all"
                icon={Square}
                disabled={!hasSelection}
                onClick={handleClearSelection}
              />
              <div className="mx-1 h-3 w-px bg-border" />
              <label className="flex h-8 items-center gap-1.5 rounded-md px-1">
                <Grid3X3 size={12} className="text-muted" />
                <input
                  type="range"
                  min={1}
                  max={6}
                  value={columns}
                  onChange={(event) => setColumns(Number(event.target.value))}
                  className="h-1 w-16 accent-accent"
                  aria-label="Grid columns"
                />
              </label>
            </>
          ) : null}

          {workspaceMode === 'inspect' && activeInspectItem ? (
            <>
              <WorkspaceFooterIconButton
                label="Previous image"
                icon={ChevronLeft}
                disabled={!canInspectPrevious}
                onClick={handleInspectPrevious}
              />
              <span className="min-w-[3rem] text-center text-xs tabular-nums text-muted">
                {activeInspectIndex + 1} / {items.length}
              </span>
              <WorkspaceFooterIconButton
                label="Next image"
                icon={ChevronRight}
                disabled={!canInspectNext}
                onClick={handleInspectNext}
              />
              <div className="mx-1 h-3 w-px bg-border" />
              <WorkspaceFooterIconButton
                label="Original"
                icon={Contrast}
                pressed={isCompareActive}
                onPointerDown={handleCompareStart}
                onPointerUp={handleCompareEnd}
                onPointerLeave={handleCompareEnd}
                onPointerCancel={handleCompareEnd}
              />
              <div className="mx-1 h-3 w-px bg-border" />
              <select
                value={JSON.stringify(inspectZoom)}
                onChange={(event) => {
                  setInspectZoom(JSON.parse(event.target.value) as InspectZoom)
                  handleCompareEnd()
                }}
                className="h-8 rounded-md border border-border bg-surface px-2.5 text-xs text-foreground"
                aria-label="Inspect zoom level"
              >
                {inspectZoomOptions.map((option) => (
                  <option key={option.label} value={JSON.stringify(option.value)}>
                    {option.label}
                  </option>
                ))}
              </select>
            </>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center justify-end">
          {items.length > 0 ? (
            <WorkspaceModeToggle
              mode={workspaceMode}
              onChange={handleWorkspaceModeChange}
              size="compact"
            />
          ) : null}
        </div>
      </footer>
    </div>
  )
}
