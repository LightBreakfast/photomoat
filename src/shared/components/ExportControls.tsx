import { Download, Package } from 'lucide-react'
import type { ExportFormat } from '@/shared/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrubberInput } from '@/shared/components/ScrubberInput'

type SingleExportControlsProps = {
  variant: 'single'
  disabled?: boolean
  label?: string
  onDownload: () => void | Promise<void>
}

type BatchExportControlsProps = {
  variant: 'batch'
  disabled?: boolean
  exportCount: number
  outputFormat: ExportFormat
  jpegQuality: number
  onOutputFormatChange: (value: ExportFormat) => void
  onJpegQualityChange: (value: number) => void
  onExport: () => void | Promise<void>
  progressMessage?: string | null
  progress?: { current: number; total: number } | null
}

type ExportControlsProps = SingleExportControlsProps | BatchExportControlsProps

const actionButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50'

export function ExportControls(props: ExportControlsProps) {
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

      <button
        type="button"
        disabled={props.disabled}
        onClick={() => void props.onExport()}
        className={`${actionButtonClassName} w-full`}
        aria-label={exportLabel}
      >
        <ExportIcon size={16} />
        {exportLabel}
      </button>

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
