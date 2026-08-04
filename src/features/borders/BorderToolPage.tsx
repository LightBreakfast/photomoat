import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Contrast,
  Copy,
  FlipHorizontal2,
  FlipVertical2,
  Grid3X3,
  Pencil,
  Package,
  RotateCcw,
  RotateCw,
  Square,
} from 'lucide-react'

import { BorderControls } from '@/features/borders/components/BorderControls'
import { BrowseWorkspace } from '@/features/borders/components/BrowseWorkspace'
import { FilterControls } from '@/features/borders/components/FilterControls'
import { InspectWorkspace } from '@/features/borders/components/InspectWorkspace'
import { PresetSelector } from '@/features/borders/components/PresetSelector'
import { SidebarSection } from '@/features/borders/components/SidebarSection'
import { WorkspaceFooterIconButton } from '@/features/borders/components/WorkspaceFooterIconButton'
import { WorkspaceModeToggle } from '@/features/borders/components/WorkspaceModeToggle'
import { resolveFilterAdjustments } from '@/features/borders/filterPresets'
import { HistoryPanel } from '@/features/borders/components/HistoryPanel'
import { getPresetById, instagramPresets } from '@/features/borders/presets'
import { renderProcessedCanvas } from '@/features/borders/processing/canvasProcessor'
import { defaultImageRecipe } from '@/features/borders/defaultImageRecipe'
import type { ImageEditRecipe, InspectZoom } from '@/features/borders/types'
import { useExportSettings } from '@/features/borders/useExportSettings'
import { useImageEdits } from '@/features/borders/useImageEdits'
import { useUndoRedoShortcuts } from '@/features/borders/useUndoRedoShortcuts'
import type { CardMenuAction } from '@/shared/components/ImageCard'
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
  const defaultRecipe = defaultImageRecipe

  // Export settings (persisted in localStorage)
  const {
    settings: exportSettings,
    setOutputFormat,
    setJpegQuality,
  } = useExportSettings()

  // Per-image edit state (in-memory)
  const {
    initializeImages,
    removeImages: removeImageRecipes,
    patchImage,
    patchImageLive,
    patchImages,
    replaceImagesWithRecipe,
    undo,
    redo,
    jumpToIndex,
    getRecipe,
    getTimeline,
  } = useImageEdits(defaultRecipe)

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

  // Initialize recipes for newly added items
  const prevItemIdsRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    const currentIds = new Set(items.map((item) => item.id))
    const newIds = items
      .filter((item) => !prevItemIdsRef.current.has(item.id))
      .map((item) => item.id)

    if (newIds.length > 0) {
      initializeImages(newIds)
    }

    // Clean up recipes for removed items
    const removedIds = [...prevItemIdsRef.current].filter((id) => !currentIds.has(id))
    if (removedIds.length > 0) {
      removeImageRecipes(removedIds)
    }

    prevItemIdsRef.current = currentIds
  }, [items, initializeImages, removeImageRecipes])

  // --- Edit target derivation ---
  const selectedReadyItems = useMemo(
    () => readyItems.filter((item) => selectedIds.has(item.id)),
    [readyItems, selectedIds],
  )

  const singleSelectedReadyItem =
    selectedReadyItems.length === 1 ? selectedReadyItems[0] : null

  const activeInspectItem = useMemo(
    () => items.find((item) => item.id === activeItemId) ?? null,
    [activeItemId, items],
  )

  const activeInspectReadyItem = useMemo(
    () => (activeInspectItem?.status === 'ready' ? activeInspectItem : null),
    [activeInspectItem],
  )

  // The direct edit target depends on workspace mode
  const directEditTargetId: string | null = useMemo(() => {
    if (workspaceMode === 'inspect') {
      return activeInspectReadyItem?.id ?? null
    }
    // browse mode
    return singleSelectedReadyItem?.id ?? null
  }, [workspaceMode, activeInspectReadyItem, singleSelectedReadyItem])

  // History timeline for the direct edit target (shown in the left panel)
  const directTimeline = useMemo(
    () => (directEditTargetId ? getTimeline(directEditTargetId) : undefined),
    [directEditTargetId, getTimeline],
  )

  const isDirectEditEnabled = directEditTargetId !== null
  const isMultiSelectDisabled = workspaceMode === 'browse' && selectedReadyItems.length >= 2

  // Current recipe for the direct edit target
  const directRecipe: ImageEditRecipe = useMemo(() => {
    if (directEditTargetId) {
      return getRecipe(directEditTargetId)
    }
    return defaultRecipe
  }, [directEditTargetId, getRecipe, defaultRecipe])

  // Filter adjustments for preview/compare (compare only affects filters)
  const activeFilterAdjustments = useMemo(
    () => resolveFilterAdjustments(isCompareActive ? 'original' : directRecipe.filterPresetId),
    [isCompareActive, directRecipe.filterPresetId],
  )

  // Selected preset for direct target (used by Inspect, not Browse)
  const directSelectedPreset = useMemo(
    () => getPresetById(directRecipe.presetId, directRecipe.customWidth, directRecipe.customHeight),
    [directRecipe.presetId, directRecipe.customWidth, directRecipe.customHeight],
  )

  const activeInspectIndex = useMemo(
    () => items.findIndex((item) => item.id === activeItemId),
    [activeItemId, items],
  )

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

  // --- Direct edit handlers ---
  // Commit: records a history entry (discrete controls, gesture ends)
  const commitDirectTarget = useCallback(
    (patch: Partial<ImageEditRecipe>) => {
      if (directEditTargetId) {
        patchImage(directEditTargetId, patch)
      }
    },
    [directEditTargetId, patchImage],
  )

  // Live: transient preview update, no history (mid-gesture)
  const livePatchDirectTarget = useCallback(
    (patch: Partial<ImageEditRecipe>) => {
      if (directEditTargetId) {
        patchImageLive(directEditTargetId, patch)
      }
    },
    [directEditTargetId, patchImageLive],
  )

  const handlePresetIdChange = useCallback(
    (presetId: ImageEditRecipe['presetId']) => {
      commitDirectTarget({ presetId })
    },
    [commitDirectTarget],
  )

  const handleBackgroundColorChange = useCallback(
    (backgroundColor: string) => {
      livePatchDirectTarget({ backgroundColor })
    },
    [livePatchDirectTarget],
  )

  const handleBackgroundColorCommit = useCallback(
    (backgroundColor: string) => {
      commitDirectTarget({ backgroundColor })
    },
    [commitDirectTarget],
  )

  const handleImageSizingModeChange = useCallback(
    (imageSizingMode: ImageEditRecipe['imageSizingMode']) => {
      commitDirectTarget({ imageSizingMode })
    },
    [commitDirectTarget],
  )

  const handleImageEdgePixelsChange = useCallback(
    (imageEdgePixels: number) => {
      livePatchDirectTarget({ imageEdgePixels })
    },
    [livePatchDirectTarget],
  )

  const handleImageEdgePixelsCommit = useCallback(
    (imageEdgePixels: number) => {
      commitDirectTarget({ imageEdgePixels })
    },
    [commitDirectTarget],
  )

  const handleBorderWidthPixelsChange = useCallback(
    (borderWidthPixels: number) => {
      livePatchDirectTarget({ borderWidthPixels })
    },
    [livePatchDirectTarget],
  )

  const handleBorderWidthPixelsCommit = useCallback(
    (borderWidthPixels: number) => {
      commitDirectTarget({ borderWidthPixels })
    },
    [commitDirectTarget],
  )

  const handleMinVerticalPaddingPixelsChange = useCallback(
    (minVerticalPaddingPixels: number) => {
      livePatchDirectTarget({ minVerticalPaddingPixels })
    },
    [livePatchDirectTarget],
  )

  const handleMinVerticalPaddingPixelsCommit = useCallback(
    (minVerticalPaddingPixels: number) => {
      commitDirectTarget({ minVerticalPaddingPixels })
    },
    [commitDirectTarget],
  )

  const handleCustomWidthChange = useCallback(
    (customWidth: number) => {
      livePatchDirectTarget({ customWidth })
    },
    [livePatchDirectTarget],
  )

  const handleCustomWidthCommit = useCallback(
    (customWidth: number) => {
      commitDirectTarget({ customWidth })
    },
    [commitDirectTarget],
  )

  const handleCustomHeightChange = useCallback(
    (customHeight: number) => {
      livePatchDirectTarget({ customHeight })
    },
    [livePatchDirectTarget],
  )

  const handleCustomHeightCommit = useCallback(
    (customHeight: number) => {
      commitDirectTarget({ customHeight })
    },
    [commitDirectTarget],
  )

  const handleFilterPresetIdChange = useCallback(
    (filterPresetId: ImageEditRecipe['filterPresetId']) => {
      commitDirectTarget({ filterPresetId })
    },
    [commitDirectTarget],
  )

  // --- Source transform handlers (rotate / flip) ---
  const rotateRecipe = (recipe: ImageEditRecipe, direction: 'cw' | 'ccw') => ({
    rotationDegrees: (recipe.rotationDegrees + (direction === 'cw' ? 90 : 270)) % 360,
  })

  const rotateLabel = (count: number, direction: 'cw' | 'ccw') =>
    `${count > 1 ? `Rotate ${count} images` : 'Rotate'} 90° ${direction === 'cw' ? 'CW' : 'CCW'}`

  const handleRotateImage = useCallback(
    (imageId: string, direction: 'cw' | 'ccw') => {
      patchImage(imageId, rotateRecipe(getRecipe(imageId), direction), rotateLabel(1, direction))
    },
    [getRecipe, patchImage],
  )

  const handleFlipImage = useCallback(
    (imageId: string, axis: 'horizontal' | 'vertical') => {
      const recipe = getRecipe(imageId)
      patchImage(
        imageId,
        axis === 'horizontal'
          ? { flipHorizontal: !recipe.flipHorizontal }
          : { flipVertical: !recipe.flipVertical },
      )
    },
    [getRecipe, patchImage],
  )

  const handleRotateSelected = useCallback(
    (direction: 'cw' | 'ccw') => {
      const ids = [...selectedIds]
      if (ids.length === 0) {
        return
      }
      patchImages(ids, (recipe) => rotateRecipe(recipe, direction), rotateLabel(ids.length, direction))
    },
    [selectedIds, patchImages],
  )

  const handleFlipSelected = useCallback(
    (axis: 'horizontal' | 'vertical') => {
      const ids = [...selectedIds]
      if (ids.length === 0) {
        return
      }
      const label = `Flip ${ids.length > 1 ? `${ids.length} images ` : ''}${axis}`
      patchImages(
        ids,
        (recipe) =>
          axis === 'horizontal'
            ? { flipHorizontal: !recipe.flipHorizontal }
            : { flipVertical: !recipe.flipVertical },
        label,
      )
    },
    [selectedIds, patchImages],
  )

  // Rotate shortcuts ([ / ]) — active only in inspect mode where there is a single edit target
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }
      if (workspaceMode !== 'inspect' || !directEditTargetId) {
        return
      }
      // Lightroom convention: Cmd/Ctrl+[ rotate left, Cmd/Ctrl+] rotate right.
      // Shift/Alt combos are reserved (browser tab switching, future shortcuts).
      const isCmdOrCtrl = event.metaKey || event.ctrlKey
      if (!isCmdOrCtrl || event.altKey || event.shiftKey) {
        return
      }
      if (event.key === '[') {
        event.preventDefault()
        handleRotateImage(directEditTargetId, 'ccw')
      } else if (event.key === ']') {
        event.preventDefault()
        handleRotateImage(directEditTargetId, 'cw')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [workspaceMode, directEditTargetId, handleRotateImage])

  // --- History navigation ---
  const handleUndo = useCallback(() => {
    if (directEditTargetId) {
      undo(directEditTargetId)
    }
  }, [directEditTargetId, undo])

  const handleRedo = useCallback(() => {
    if (directEditTargetId) {
      redo(directEditTargetId)
    }
  }, [directEditTargetId, redo])

  const handleJump = useCallback(
    (index: number) => {
      if (directEditTargetId) {
        jumpToIndex(directEditTargetId, index)
      }
    },
    [directEditTargetId, jumpToIndex],
  )

  useUndoRedoShortcuts({
    targetId: directEditTargetId,
    onUndo: handleUndo,
    onRedo: handleRedo,
  })

  // --- Batch apply via card context menu ---
  const handleApplySourceToSelected = useCallback(
    (sourceId: string) => {
      const sourceRecipe = getRecipe(sourceId)
      const targetIds = selectedReadyItems
        .filter((item) => item.id !== sourceId)
        .map((item) => item.id)
      if (targetIds.length > 0) {
        replaceImagesWithRecipe(
          targetIds,
          sourceRecipe,
          `Apply preset to ${targetIds.length} image${targetIds.length > 1 ? 's' : ''}`,
        )
      }
    },
    [getRecipe, selectedReadyItems, replaceImagesWithRecipe],
  )

  // --- Card context menu factory ---
  const getItemMenuActions = useCallback(
    (id: string): CardMenuAction[] => {
      const isSelected = selectedIds.has(id)
      const hasMultipleSelected = selectedReadyItems.length >= 2
      const recipe = getRecipe(id)

      // Per-card transform section is always available (rotate / flip this card)
      const actions: CardMenuAction[] = [
        {
          label: 'Transform',
          items: [
            {
              label: 'Rotate 90° CW',
              icon: <RotateCw size={14} />,
              onClick: () => handleRotateImage(id, 'cw'),
            },
            {
              label: 'Rotate 90° CCW',
              icon: <RotateCcw size={14} />,
              onClick: () => handleRotateImage(id, 'ccw'),
            },
            {
              label: 'Flip horizontal',
              checked: recipe.flipHorizontal,
              onClick: () => handleFlipImage(id, 'horizontal'),
            },
            {
              label: 'Flip vertical',
              checked: recipe.flipVertical,
              onClick: () => handleFlipImage(id, 'vertical'),
            },
          ],
        },
      ]

      // Batch section only appears when multiple images are selected and this card is one of them
      if (hasMultipleSelected && isSelected) {
        actions.push(
          { type: 'separator' },
          {
            label: 'Selection',
            items: [
              {
                label: 'Apply to selected',
                icon: <Copy size={14} />,
                onClick: () => handleApplySourceToSelected(id),
              },
              {
                label: 'Rotate selected 90° CW',
                icon: <RotateCw size={14} />,
                onClick: () => handleRotateSelected('cw'),
              },
              {
                label: 'Rotate selected 90° CCW',
                icon: <RotateCcw size={14} />,
                onClick: () => handleRotateSelected('ccw'),
              },
              {
                label: 'Flip selected horizontal',
                icon: <FlipHorizontal2 size={14} />,
                onClick: () => handleFlipSelected('horizontal'),
              },
              {
                label: 'Flip selected vertical',
                icon: <FlipVertical2 size={14} />,
                onClick: () => handleFlipSelected('vertical'),
              },
            ],
          },
        )
      }

      return actions
    },
    [
      selectedIds,
      selectedReadyItems,
      getRecipe,
      handleApplySourceToSelected,
      handleRotateSelected,
      handleFlipSelected,
      handleRotateImage,
      handleFlipImage,
    ],
  )

  // --- Per-item recipe resolver for Browse ---
  const getItemRecipe = useCallback(
    (id: string) => getRecipe(id),
    [getRecipe],
  )

  // Per-item filter adjustments for Browse (compare overrides to original)
  const getItemFilterAdjustments = useCallback(
    (id: string) => {
      const recipe = getRecipe(id)
      return resolveFilterAdjustments(isCompareActive ? 'original' : recipe.filterPresetId)
    },
    [getRecipe, isCompareActive],
  )

  // --- Selection handlers ---
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

  // --- Export ---
  const createProcessedBlob = async (item: ImageQueueItem) => {
    const recipe = getRecipe(item.id)
    const preset = getPresetById(recipe.presetId, recipe.customWidth, recipe.customHeight)
    const filterAdjustments = resolveFilterAdjustments(recipe.filterPresetId)

    const canvas = await renderProcessedCanvas({
      sourceUrl: item.objectUrl,
      targetWidth: preset.width,
      targetHeight: preset.height,
      backgroundColor: recipe.backgroundColor,
      sizingMode: recipe.imageSizingMode,
      edgePixels: recipe.imageEdgePixels,
      borderWidthPixels: recipe.borderWidthPixels,
      minVerticalPaddingPixels: recipe.minVerticalPaddingPixels,
      filterAdjustments,
      rotationDegrees: recipe.rotationDegrees,
      flipHorizontal: recipe.flipHorizontal,
      flipVertical: recipe.flipVertical,
    })

    return canvasToBlob(canvas, exportSettings.outputFormat, exportSettings.jpegQuality)
  }

  const handleSingleExport = async (item: ImageQueueItem) => {
    setActiveDownloadId(item.id)
    setItemStatus(item.id, 'processing')
    setProgressMessage(`Preparing ${item.filename}…`)

    try {
      const blob = await createProcessedBlob(item)
      downloadBlob(blob, createBorderedFilename(item.filename, exportSettings.outputFormat))
      setItemStatus(item.id, 'ready')
      setProgressMessage(`${item.filename} downloaded.`)
    } catch {
      setItemStatus(item.id, 'error', 'Export failed.')
      setProgressMessage('Export failed.')
    } finally {
      setActiveDownloadId(null)
    }
  }

  const handleZipExport = async (itemsToExport: ImageQueueItem[]) => {
    if (itemsToExport.length === 0) {
      setProgressMessage('No images to export.')
      return
    }

    setProgress({ current: 0, total: itemsToExport.length })
    setProgressMessage(
      `Preparing ${itemsToExport.length} image${itemsToExport.length > 1 ? 's' : ''}…`,
    )

    try {
      await exportZip({
        items: itemsToExport,
        zipFilename: 'photomoat-borders.zip',
        createEntry: async (item) => {
          setItemStatus(item.id, 'processing')

          try {
            const blob = await createProcessedBlob(item)
            setItemStatus(item.id, 'ready')

            return {
              filename: createBorderedFilename(item.filename, exportSettings.outputFormat),
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

  const handleExport = async () => {
    if (exportItems.length === 0) {
      setProgressMessage('No images to export.')
      return
    }

    if (exportItems.length === 1) {
      await handleSingleExport(exportItems[0])
      return
    }

    await handleZipExport(exportItems)
  }

  // --- Navigation ---
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

  // --- Footer status ---
  const footerStatus =
    message ??
    (workspaceMode === 'inspect' && activeInspectItem
      ? `Editing current image · ${activeInspectItem.filename}`
      : isMultiSelectDisabled
        ? `${selectedIds.size} images selected`
        : hasSelection && singleSelectedReadyItem
          ? singleSelectedReadyItem.filename
          : items.length > 0
            ? `${items.length} image${items.length > 1 ? 's' : ''}`
            : 'Ready')

  // --- Panels ---
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
        selectedPresetId={directRecipe.filterPresetId}
        onPresetChange={handleFilterPresetIdChange}
        disabled={!isDirectEditEnabled}
      />
    </div>
  )

  const rightPanelContent = (
    <div className="space-y-5">
      <SidebarSection title="Dimensions">
        <PresetSelector
          instagramPresets={instagramPresets}
          selectedPresetId={directRecipe.presetId}
          onChange={handlePresetIdChange}
          customWidth={directRecipe.customWidth}
          customHeight={directRecipe.customHeight}
          onCustomWidthChange={handleCustomWidthChange}
          onCustomHeightChange={handleCustomHeightChange}
          onCustomWidthCommit={handleCustomWidthCommit}
          onCustomHeightCommit={handleCustomHeightCommit}
          disabled={!isDirectEditEnabled}
        />
      </SidebarSection>

      <SidebarSection title="Border">
        <BorderControls
          backgroundColor={directRecipe.backgroundColor}
          imageSizingMode={directRecipe.imageSizingMode}
          imageEdgePixels={directRecipe.imageEdgePixels}
          borderWidthPixels={directRecipe.borderWidthPixels}
          minVerticalPaddingPixels={directRecipe.minVerticalPaddingPixels}
          onBackgroundColorChange={handleBackgroundColorChange}
          onBackgroundColorCommit={handleBackgroundColorCommit}
          onImageSizingModeChange={handleImageSizingModeChange}
          onImageEdgePixelsChange={handleImageEdgePixelsChange}
          onImageEdgePixelsCommit={handleImageEdgePixelsCommit}
          onBorderWidthPixelsChange={handleBorderWidthPixelsChange}
          onBorderWidthPixelsCommit={handleBorderWidthPixelsCommit}
          onMinVerticalPaddingPixelsChange={handleMinVerticalPaddingPixelsChange}
          onMinVerticalPaddingPixelsCommit={handleMinVerticalPaddingPixelsCommit}
          disabled={!isDirectEditEnabled}
        />
      </SidebarSection>

      {items.length > 0 ? (
        <SidebarSection title="Export">
          <ExportControls
            variant="batch"
            disabled={exportItems.length === 0}
            outputFormat={exportSettings.outputFormat}
            jpegQuality={exportSettings.jpegQuality}
            onOutputFormatChange={setOutputFormat}
            onJpegQualityChange={setJpegQuality}
            exportCount={exportItems.length}
            onExport={handleExport}
            progressMessage={progressMessage}
            progress={progress}
          />
        </SidebarSection>
      ) : null}
    </div>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
          <div className="min-h-0 flex-1 overflow-y-auto p-3">{leftPanelContent}</div>
          <HistoryPanel
            timeline={directTimeline}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onJump={handleJump}
            className="shrink-0 border-t border-border p-3"
          />
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
                <Package size={16} />
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
            <div className="scrollbar-hover flex flex-1 min-h-0 overflow-y-auto">
              <BrowseWorkspace
                items={items}
                getItemRecipe={getItemRecipe}
                getItemFilterAdjustments={getItemFilterAdjustments}
                getItemMenuActions={getItemMenuActions}
                columns={columns}
                activeDownloadId={activeDownloadId}
                selectedIds={selectedIds}
                onRemove={handleRemoveItem}
                onDownload={handleSingleExport}
                onInspect={handleInspect}
                onToggleSelect={handleToggleSelect}
              />
            </div>
          ) : (
            <InspectWorkspace
              item={activeInspectItem}
              preset={directSelectedPreset}
              backgroundColor={directRecipe.backgroundColor}
              sizingMode={directRecipe.imageSizingMode}
              edgePixels={directRecipe.imageEdgePixels}
              borderWidthPixels={directRecipe.borderWidthPixels}
              minVerticalPaddingPixels={directRecipe.minVerticalPaddingPixels}
              filterAdjustments={activeFilterAdjustments}
              rotationDegrees={directRecipe.rotationDegrees}
              flipHorizontal={directRecipe.flipHorizontal}
              flipVertical={directRecipe.flipVertical}
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
            <div className="sidebar-panel sidebar-left flex flex-col p-3">
              <div className="min-h-0 flex-1 overflow-y-auto">{leftPanelContent}</div>
              <HistoryPanel
                timeline={directTimeline}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onJump={handleJump}
                className="shrink-0 border-t border-border pt-3"
              />
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

        <div className="scrollbar-hover flex min-w-0 items-center justify-start gap-2 overflow-x-auto md:justify-center">
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
              <span className="min-w-[3rem] shrink-0 text-center text-xs tabular-nums text-muted">
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
              <WorkspaceFooterIconButton
                label="Rotate left"
                icon={RotateCcw}
                shortcut="["
                disabled={!directEditTargetId}
                onClick={() => directEditTargetId && handleRotateImage(directEditTargetId, 'ccw')}
              />
              <WorkspaceFooterIconButton
                label="Rotate right"
                icon={RotateCw}
                shortcut="]"
                disabled={!directEditTargetId}
                onClick={() => directEditTargetId && handleRotateImage(directEditTargetId, 'cw')}
              />
              <WorkspaceFooterIconButton
                label="Flip horizontal"
                icon={FlipHorizontal2}
                pressed={directRecipe.flipHorizontal}
                disabled={!directEditTargetId}
                onClick={() => directEditTargetId && handleFlipImage(directEditTargetId, 'horizontal')}
              />
              <WorkspaceFooterIconButton
                label="Flip vertical"
                icon={FlipVertical2}
                pressed={directRecipe.flipVertical}
                disabled={!directEditTargetId}
                onClick={() => directEditTargetId && handleFlipImage(directEditTargetId, 'vertical')}
              />
              <div className="mx-1 h-3 w-px bg-border" />
              <select
                value={JSON.stringify(inspectZoom)}
                onChange={(event) => {
                  setInspectZoom(JSON.parse(event.target.value) as InspectZoom)
                  handleCompareEnd()
                }}
                className="h-8 shrink-0 rounded-md border border-border bg-surface px-2.5 text-xs text-foreground"
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
