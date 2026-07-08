import { Download } from 'lucide-react'
import type { ExportFormat } from '@/shared/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'

type SingleExportControlsProps = {
  variant: 'single'
  disabled?: boolean
  label?: string
  onDownload: () => void | Promise<void>
}

type BatchExportControlsProps = {
  variant: 'batch'
  disabled?: boolean
  outputFormat: ExportFormat
  jpegQuality: number
  onOutputFormatChange: (value: ExportFormat) => void
  onJpegQualityChange: (value: number) => void
  onBatchExport: () => void | Promise<void>
  progressMessage?: string | null
  progress?: { current: number; total: number } | null
}

type ExportControlsProps = SingleExportControlsProps | BatchExportControlsProps

export function ExportControls(props: ExportControlsProps) {
  if (props.variant === 'single') {
    return (
      <button
        type="button"
        disabled={props.disabled}
        onClick={() => void props.onDownload()}
        className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        {props.label ?? 'Download'}
      </button>
    )
  }

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
          <label className="block space-y-1">
            <span className="text-xs font-medium text-muted">
              Quality {Math.round(props.jpegQuality * 100)}%
            </span>
            <Slider
              min={0.6}
              max={1}
              step={0.05}
              value={[props.jpegQuality]}
              onValueChange={(value) => {
                const v = Array.isArray(value) ? value[0] : value
                props.onJpegQualityChange(v)
              }}
            />
          </label>
        ) : null}
      </div>

      <button
        type="button"
        disabled={props.disabled}
        onClick={() => void props.onBatchExport()}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Download size={15} />
        Export ZIP
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
