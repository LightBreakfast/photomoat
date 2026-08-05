import { useRef } from 'react'
import { Download, Package } from 'lucide-react'
import type { ExportFormat } from '@/shared/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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

const actionButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50'

const dialogInputClassName =
  'w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

const tokenButtonClassName =
  'rounded border border-border bg-surface px-1 py-0.5 font-mono text-[0.7rem] leading-none text-muted transition-colors hover:border-ring hover:text-foreground'

export function ExportControls(props: ExportControlsProps) {
  const patternInputRef = useRef<HTMLInputElement>(null)

  if (props.variant === 'single') {
    return (
      <button
        type="button"
        disabled={props.disabled}
        onClick={() => void props.onDownload()}
        className={actionButtonClassName}
      >
        <Download size={15} />
        {props.label ?? 'Download'}
      </button>
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
  const folderPreview = createExportZipName(props.folderName)

  const insertPatternToken = (token: string) => {
    const input = patternInputRef.current
    if (!input) {
      return
    }

    const start = input.selectionStart ?? input.value.length
    const end = input.selectionEnd ?? input.value.length
    props.onFilenamePatternChange(input.value.slice(0, start) + token + input.value.slice(end))

    requestAnimationFrame(() => {
      input.focus()
      const cursorPosition = start + token.length
      input.setSelectionRange(cursorPosition, cursorPosition)
    })
  }

  const dialogContent = (
    <>
      <DialogHeader>
        <DialogTitle>Export settings</DialogTitle>
        <DialogDescription>
          Use {'{name}'} for the original filename and {'{date}'} / {'{time}'} /{' '}
          {'{datetime}'} for timestamps. The folder name is used for the ZIP
          archive.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">Filename pattern</span>
          <input
            ref={patternInputRef}
            type="text"
            autoFocus
            value={props.filenamePattern}
            onChange={(event) => props.onFilenamePatternChange(event.target.value)}
            placeholder={defaultFilenamePattern}
            aria-label="Filename pattern"
            className={dialogInputClassName}
          />
          <span className="block">
            <span className="sr-only">Insert token</span>
            {filenamePatternTokens.map((token) => (
              <button
                key={token}
                type="button"
                onClick={() => insertPatternToken(token)}
                className={`${tokenButtonClassName} mr-1`}
                aria-label={`Insert ${token}`}
              >
                {token}
              </button>
            ))}
          </span>
          <span className="block truncate text-xs text-muted" aria-live="polite">
            Preview: {filenamePreview}
          </span>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">Folder name (ZIP)</span>
          <input
            type="text"
            value={props.folderName}
            onChange={(event) => props.onFolderNameChange(event.target.value)}
            aria-label="Folder name"
            className={dialogInputClassName}
          />
          <span className="block truncate text-xs text-muted" aria-live="polite">
            Preview: {folderPreview}
          </span>
        </label>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          onClick={props.onResetExportSettings}
          className="mr-auto"
        >
          Reset to defaults
        </Button>
        <DialogClose render={<Button variant="outline">Done</Button>} />
      </DialogFooter>
    </>
  )

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted">Format</span>
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
        <p className="text-xs text-muted" aria-live="polite">
          {props.progressMessage}
        </p>
      ) : null}
    </div>
  )
}
