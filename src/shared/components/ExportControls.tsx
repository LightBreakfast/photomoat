import { useId, useRef } from 'react'
import { Download, Package } from 'lucide-react'
import type { ExportFormat } from '@/shared/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DialogClose, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrubberInput } from '@/shared/components/ScrubberInput'
import { SplitButton } from '@/shared/components/SplitButton'
import {
  createExportFilename,
  createExportZipName,
  defaultFilenamePattern,
  filenamePatternTokens,
} from '@/shared/utils/filename'

export type SingleExportControlsProps = {
  variant: 'single'
  disabled?: boolean
  label?: string
  onDownload: () => void | Promise<void>
}

export type BatchExportControlsProps = {
  variant: 'batch'
  disabled?: boolean
  exportCount: number
  outputFormat: ExportFormat
  jpegQuality: number
  filenamePattern: string
  folderName: string
  onOutputFormatChange: (value: ExportFormat) => void
  onJpegQualityChange: (value: number) => void
  onFilenamePatternChange: (value: string) => void
  onFolderNameChange: (value: string) => void
  onResetExportSettings: () => void
  onExport: () => void | Promise<void>
  /** Original filename of the first export item, used for the filename preview. */
  previewFilename?: string
  progressMessage?: string | null
  progress?: { current: number; total: number } | null
}

type ExportControlsProps = SingleExportControlsProps | BatchExportControlsProps

/**
 * Shared token-button style: border-only badge with consistent focus ring.
 * Matches the app's input radius (rounded-md) and uses bg-surface for
 * contrast against the popover background.
 */
const tokenButtonClassName =
  'rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[0.7rem] leading-none text-muted-foreground outline-none transition-colors hover:border-ring hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export function ExportControls(props: ExportControlsProps) {
  const patternInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const patternInputId = useId()
  const patternPreviewId = useId()
  const folderInputId = useId()
  const folderPreviewId = useId()

  if (props.variant === 'single') {
    return (
      <Button
        disabled={props.disabled}
        onClick={() => void props.onDownload()}
      >
        <Download size={15} />
        {props.label ?? 'Download'}
      </Button>
    )
  }

  const exportLabel = props.exportCount === 1 ? 'Export image' : 'Export ZIP'
  const ExportIcon = props.exportCount === 1 ? Download : Package

  const previewBaseFilename = props.previewFilename ?? 'photo.jpg'
  const filenamePreview = createExportFilename({
    originalFilename: previewBaseFilename,
    format: props.outputFormat,
    pattern: props.filenamePattern,
  })
  const folderPreview = createExportZipName(props.folderName, {
    originalFilename: previewBaseFilename,
  })

  const insertPatternToken = (token: string, target: 'pattern' | 'folder') => {
    const input = target === 'pattern' ? patternInputRef.current : folderInputRef.current
    if (!input) {
      return
    }

    const start = input.selectionStart ?? input.value.length
    const end = input.selectionEnd ?? input.value.length
    const onChange =
      target === 'pattern' ? props.onFilenamePatternChange : props.onFolderNameChange
    onChange(input.value.slice(0, start) + token + input.value.slice(end))

    requestAnimationFrame(() => {
      input.focus()
      const cursorPosition = start + token.length
      input.setSelectionRange(cursorPosition, cursorPosition)
    })
  }

  const renderTokenButtons = (target: 'pattern' | 'folder', nameSuffix: string) => (
    <span className="flex flex-wrap gap-1">
      {filenamePatternTokens.map((token) => (
        <button
          key={token}
          type="button"
          onClick={() => insertPatternToken(token, target)}
          className={tokenButtonClassName}
          aria-label={`Insert ${token} ${nameSuffix}`}
        >
          {token}
        </button>
      ))}
    </span>
  )

  const dialogContent = (
    <>
      <DialogTitle className="text-lg font-semibold">Export settings</DialogTitle>

      <div className="space-y-5">
        <div className="space-y-2">
          <label htmlFor={patternInputId} className="block text-xs font-medium text-muted-foreground">
            Filename pattern
          </label>
          <Input
            ref={patternInputRef}
            id={patternInputId}
            autoFocus
            value={props.filenamePattern}
            onChange={(event) => props.onFilenamePatternChange(event.target.value)}
            placeholder={defaultFilenamePattern}
            aria-describedby={patternPreviewId}
          />
          {renderTokenButtons('pattern', 'into pattern')}
          <p id={patternPreviewId} className="truncate text-xs">
            <span className="text-muted-foreground">Preview: </span>
            <span className="font-mono text-foreground">{filenamePreview}</span>
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor={folderInputId} className="block text-xs font-medium text-muted-foreground">
            ZIP file name
          </label>
          <Input
            ref={folderInputRef}
            id={folderInputId}
            value={props.folderName}
            onChange={(event) => props.onFolderNameChange(event.target.value)}
            aria-describedby={folderPreviewId}
          />
          {renderTokenButtons('folder', 'into folder name')}
          <p id={folderPreviewId} className="truncate text-xs">
            <span className="text-muted-foreground">Preview: </span>
            <span className="font-mono text-foreground">{folderPreview}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={props.onResetExportSettings}>
          Reset to defaults
        </Button>
        <DialogClose render={<Button>Done</Button>} />
      </div>
    </>
  )

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Format</span>
          <Select
            value={props.outputFormat}
            onValueChange={(value) => props.onOutputFormatChange(value as ExportFormat)}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {(value: string) =>
                  value === 'image/jpeg' ? 'JPG' : value === 'image/png' ? 'PNG' : value
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="image/png">PNG</SelectItem>
              <SelectItem value="image/jpeg">JPG</SelectItem>
            </SelectContent>
          </Select>
        </label>

        {props.outputFormat === 'image/jpeg' ? (
          <ScrubberInput
            label="Quality"
            scrubLabel="Quality"
            value={Math.round(props.jpegQuality * 100)}
            min={60}
            max={100}
            step={5}
            onChange={(percent) => props.onJpegQualityChange(percent / 100)}
            ariaLabel="JPEG quality percent"
            layout="inline"
          />
        ) : null}
      </div>

      <SplitButton
        label={exportLabel}
        icon={<ExportIcon size={16} />}
        disabled={props.disabled}
        onAction={props.onExport}
        caretLabel="Export options"
        dialogContent={dialogContent}
        dialogContentClassName="gap-5 p-5 sm:max-w-md"
        showDialogCloseButton={false}
      />

      {props.progress ? (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${(props.progress.current / props.progress.total) * 100}%` }}
          />
        </div>
      ) : null}

      {props.progressMessage ? (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {props.progressMessage}
        </p>
      ) : null}
    </div>
  )
}
