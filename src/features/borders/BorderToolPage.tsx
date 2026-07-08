import { useMemo, useState } from 'react'
import { CheckSquare, Grid3X3, Settings, Square } from 'lucide-react'

import { BorderControls } from '@/features/borders/components/BorderControls'
import { PresetSelector } from '@/features/borders/components/PresetSelector'
import { getPresetById, instagramPresets } from '@/features/borders/presets'
import { renderProcessedCanvas } from '@/features/borders/processing/canvasProcessor'
import { useBorderSettings } from '@/features/borders/useBorderSettings'
import { Dropzone } from '@/shared/components/Dropzone'
import { ExportControls } from '@/shared/components/ExportControls'
import { ImageGrid } from '@/shared/components/ImageGrid'
import { ImageViewer } from '@/shared/components/ImageViewer'
import { PreviewCanvas } from '@/shared/components/PreviewCanvas'
import { Tooltip } from '@/shared/components/Tooltip'
import { useImageQueue } from '@/shared/hooks/useImageQueue'
import type { ImageQueueItem } from '@/shared/types'
import { canvasToBlob, downloadBlob } from '@/shared/utils/downloadBlob'
import { exportZip } from '@/shared/utils/exportZip'
import { createBorderedFilename } from '@/shared/utils/filename'

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
  } = useBorderSettings()
  const { items, message, addFiles, removeItem, setItemStatus } =
    useImageQueue()
  const [activeDownloadId, setActiveDownloadId] = useState<string | null>(null)
  const [progressMessage, setProgressMessage] = useState<string | null>(null)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [mobilePanel, setMobilePanel] = useState<'none' | 'left' | 'right'>('none')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [columns, setColumns] = useState(3)

  const selectedPreset = useMemo(
    () => getPresetById(settings.presetId),
    [settings.presetId],
  )

  const readyItems = useMemo(
    () => items.filter((item) => item.status === 'ready'),
    [items],
  )

  const hasSelection = selectedIds.size > 0
  const exportItems = hasSelection
    ? readyItems.filter((item) => selectedIds.has(item.id))
    : readyItems

  const handleToggleSelect = (id: string, event: { metaKey: boolean; ctrlKey: boolean }) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const modifier = event.metaKey || event.ctrlKey

      if (modifier) {
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
      } else {
        if (next.has(id) && next.size === 1) {
          next.clear()
        } else {
          next.clear()
          next.add(id)
        }
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
      if (!prev.has(id)) return prev
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
    setProgressMessage(`Preparing ${exportItems.length} image${exportItems.length > 1 ? 's' : ''}…`)

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

  const leftPanelContent = (
    <div className="space-y-5">
      <Dropzone
        variant="compact"
        onFilesAccepted={async (files) => {
          await addFiles(files)
          setMobilePanel('none')
        }}
      />
      <PresetSelector
        presets={instagramPresets}
        selectedPresetId={settings.presetId}
        onChange={setPresetId}
      />
    </div>
  )

  const rightPanelContent = (
    <div className="space-y-5">
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
        {/* Desktop left panel */}
        <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-border bg-surface p-3 md:block">
          {leftPanelContent}
        </aside>

        {/* Centre panel */}
        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-background p-4">
          {/* Mobile toolbar */}
          <div className="mb-3 flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setMobilePanel('left')}
              className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-xs text-muted hover:text-foreground"
              aria-label="Open presets"
            >
              <Grid3X3 size={16} />
              Presets
            </button>
            {items.length > 0 ? (
              <button
                type="button"
                onClick={() => setMobilePanel('right')}
                className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-xs text-muted hover:text-foreground"
                aria-label="Open controls"
              >
                <Settings size={16} />
                Controls
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
          ) : items.length === 1 ? (
            <div className="flex flex-1 items-center justify-center p-4">
              <PreviewCanvas
                sourceUrl={items[0].objectUrl}
                preset={selectedPreset}
                backgroundColor={settings.backgroundColor}
                sizingMode={settings.imageSizingMode}
                edgePixels={settings.imageEdgePixels}
                borderWidthPixels={settings.borderWidthPixels}
                label={`Preview for ${items[0].filename}`}
                fullSize
              />
            </div>
          ) : (
            <ImageGrid
              items={items}
              preset={selectedPreset}
              backgroundColor={settings.backgroundColor}
              sizingMode={settings.imageSizingMode}
              edgePixels={settings.imageEdgePixels}
              borderWidthPixels={settings.borderWidthPixels}
              columns={columns}
              activeDownloadId={activeDownloadId}
              selectedIds={selectedIds}
              onRemove={handleRemoveItem}
              onDownload={handleSingleDownload}
              onPreview={setViewerIndex}
              onToggleSelect={handleToggleSelect}
            />
          )}
        </main>

        {/* Desktop right panel */}
        <aside className="hidden w-70 shrink-0 overflow-y-auto border-l border-border bg-surface p-3 md:block">
          {rightPanelContent}
        </aside>
      </div>

      {/* Mobile sidebar overlays */}
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

      {/* Status bar */}
      <footer className="flex h-8 shrink-0 items-center border-t border-border bg-surface px-4">
        <p className="w-48 text-xs text-muted">
          {message ?? (hasSelection
            ? `${selectedIds.size} of ${items.length} selected`
            : items.length > 0 ? `${items.length} image${items.length > 1 ? 's' : ''}` : 'Ready')}
        </p>
        <div className="flex flex-1 items-center justify-center gap-2">
          {items.length > 1 ? (
            <>
              <Tooltip label="Select all">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="flex h-6 w-6 items-center justify-center text-muted hover:text-foreground"
                  aria-label="Select all"
                >
                  <CheckSquare size={14} />
                </button>
              </Tooltip>
              <Tooltip label="Deselect">
                <button
                  type="button"
                  onClick={handleClearSelection}
                  disabled={!hasSelection}
                  className="flex h-6 w-6 items-center justify-center text-muted disabled:cursor-not-allowed disabled:opacity-40 hover:text-foreground"
                  aria-label="Deselect all"
                >
                  <Square size={14} />
                </button>
              </Tooltip>
              <div className="mx-1 h-3 w-px bg-border" />
              <label className="flex items-center gap-1.5">
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
        </div>
        <div className="w-48" />
      </footer>

      {viewerIndex !== null ? (
        <ImageViewer
          items={items}
          currentIndex={viewerIndex}
          preset={selectedPreset}
          backgroundColor={settings.backgroundColor}
          sizingMode={settings.imageSizingMode}
          edgePixels={settings.imageEdgePixels}
          borderWidthPixels={settings.borderWidthPixels}
          onClose={() => setViewerIndex(null)}
          onNavigate={setViewerIndex}
        />
      ) : null}
    </div>
  )
}
