import type { OutputPreset, OutputPresetId } from '@/shared/types'

type PresetSelectorProps = {
  presets: OutputPreset[]
  selectedPresetId: OutputPresetId
  onChange: (presetId: OutputPresetId) => void
}

export function PresetSelector({
  presets,
  selectedPresetId,
  onChange,
}: PresetSelectorProps) {
  return (
    <div className="space-y-1">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
        Preset
      </p>
      {presets.map((preset) => {
        const isSelected = preset.id === selectedPresetId

        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onChange(preset.id)}
            aria-pressed={isSelected}
            className={[
              'flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm',
              isSelected
                ? 'border-border bg-surface-muted font-medium text-foreground'
                : 'border-transparent text-muted hover:text-foreground',
            ].join(' ')}
          >
            <span>{preset.label}</span>
            <span className="text-xs tabular-nums text-muted">
              {preset.width}×{preset.height}
            </span>
          </button>
        )
      })}
    </div>
  )
}
