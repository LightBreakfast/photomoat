import { SlidersHorizontal } from 'lucide-react'

import {
  customSizeMax,
  customSizeMin,
} from '@/features/borders/constants'
import type { OutputPreset, OutputPresetId } from '@/shared/types'
import { ScrubberInput } from '@/shared/components/ScrubberInput'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type PresetSelectorProps = {
  instagramPresets: OutputPreset[]
  selectedPresetId: OutputPresetId
  onChange: (presetId: OutputPresetId) => void
  customWidth?: number
  customHeight?: number
  onCustomWidthChange?: (width: number) => void
  onCustomHeightChange?: (height: number) => void
}

type PresetSummaryProps = {
  label: string
  dimensions: string
  icon: 'instagram' | 'custom'
}

function getPresetDisplayLabel(label: string) {
  return label.replace(' Post', '')
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1000 1000"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M295.42,6c-53.2,2.51-89.53,11-121.29,23.48-32.87,12.81-60.73,30-88.45,57.82S40.89,143,28.17,175.92c-12.31,31.83-20.65,68.19-23,121.42S2.3,367.68,2.56,503.46,3.42,656.26,6,709.6c2.54,53.19,11,89.51,23.48,121.28,12.83,32.87,30,60.72,57.83,88.45S143,964.09,176,976.83c31.8,12.29,68.17,20.67,121.39,23s70.35,2.87,206.09,2.61,152.83-.86,206.16-3.39S799.1,988,830.88,975.58c32.87-12.86,60.74-30,88.45-57.84S964.1,862,976.81,829.06c12.32-31.8,20.69-68.17,23-121.35,2.33-53.37,2.88-70.41,2.62-206.17s-.87-152.78-3.4-206.1-11-89.53-23.47-121.32c-12.85-32.87-30-60.7-57.82-88.45S862,40.87,829.07,28.19c-31.82-12.31-68.17-20.7-121.39-23S637.33,2.3,501.54,2.56,348.75,3.4,295.42,6m5.84,903.88c-48.75-2.12-75.22-10.22-92.86-17-23.36-9-40-19.88-57.58-37.29s-28.38-34.11-37.5-57.42c-6.85-17.64-15.1-44.08-17.38-92.83-2.48-52.69-3-68.51-3.29-202s.22-149.29,2.53-202c2.08-48.71,10.23-75.21,17-92.84,9-23.39,19.84-40,37.29-57.57s34.1-28.39,57.43-37.51c17.62-6.88,44.06-15.06,92.79-17.38,52.73-2.5,68.53-3,202-3.29s149.31.21,202.06,2.53c48.71,2.12,75.22,10.19,92.83,17,23.37,9,40,19.81,57.57,37.29s28.4,34.07,37.52,57.45c6.89,17.57,15.07,44,17.37,92.76,2.51,52.73,3.08,68.54,3.32,202s-.23,149.31-2.54,202c-2.13,48.75-10.21,75.23-17,92.89-9,23.35-19.85,40-37.31,57.56s-34.09,28.38-57.43,37.5c-17.6,6.87-44.07,15.07-92.76,17.39-52.73,2.48-68.53,3-202.05,3.29s-149.27-.25-202-2.53m407.6-674.61a60,60,0,1,0,59.88-60.1,60,60,0,0,0-59.88,60.1M245.77,503c.28,141.8,115.44,256.49,257.21,256.22S759.52,643.8,759.25,502,643.79,245.48,502,245.76,245.5,361.22,245.77,503m90.06-.18a166.67,166.67,0,1,1,167,166.34,166.65,166.65,0,0,1-167-166.34"
        transform="translate(-2.5 -2.5)"
      />
    </svg>
  )
}

function PresetSummary({ label, dimensions, icon }: PresetSummaryProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted">
        {icon === 'instagram' ? (
          <InstagramIcon className="size-3.5" />
        ) : (
          <SlidersHorizontal size={14} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{label}</div>
        <div className="text-xs tabular-nums text-muted">{dimensions} px</div>
      </div>
    </div>
  )
}

export function PresetSelector({
  instagramPresets,
  selectedPresetId,
  onChange,
  customWidth = 1080,
  customHeight = 1080,
  onCustomWidthChange,
  onCustomHeightChange,
}: PresetSelectorProps) {
  const selectedPreset = instagramPresets.find((preset) => preset.id === selectedPresetId)
  const isCustomSelected = selectedPresetId === 'custom'
  const selectedLabel = isCustomSelected
    ? 'Custom'
    : getPresetDisplayLabel(selectedPreset?.label ?? 'Square Post')
  const selectedDimensions = isCustomSelected
    ? `${customWidth}×${customHeight}`
    : selectedPreset
      ? `${selectedPreset.width}×${selectedPreset.height}`
      : '1080×1080'

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">Size</p>

      <div className="overflow-hidden rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        <Select
          value={selectedPresetId}
          onValueChange={(value) => onChange(value as OutputPresetId)}
        >
          <SelectTrigger
            className="h-auto min-h-16 w-full rounded-none border-0 px-3 py-3 shadow-none focus-visible:ring-0"
            aria-label="Instagram size preset"
          >
            <SelectValue>
              <PresetSummary
                label={selectedLabel}
                dimensions={selectedDimensions}
                icon={isCustomSelected ? 'custom' : 'instagram'}
              />
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel className="flex items-center gap-2">
                <InstagramIcon className="size-3" />
                Instagram
              </SelectLabel>
              {instagramPresets.map((preset) => (
                <SelectItem
                  key={preset.id}
                  value={preset.id}
                  className="pr-2 [&>span:last-child]:hidden"
                >
                  <div className="min-w-0 flex-1 py-1">
                    <div className="truncate font-medium text-foreground">
                      {getPresetDisplayLabel(preset.label)}
                    </div>
                    <div className="text-xs tabular-nums text-muted">
                      {preset.width}×{preset.height} px
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Custom</SelectLabel>
              <SelectItem value="custom" className="pr-2 [&>span:last-child]:hidden">
                <div className="min-w-0 flex-1 py-1">
                  <div className="truncate font-medium text-foreground">Custom</div>
                  <div className="text-xs tabular-nums text-muted">
                    {customWidth}×{customHeight} px
                  </div>
                </div>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        {isCustomSelected && onCustomWidthChange && onCustomHeightChange ? (
          <div className="border-t border-border bg-surface px-3 py-3">
            <div className="grid grid-cols-2 gap-3">
              <ScrubberInput
                label="Width"
                value={customWidth}
                min={customSizeMin}
                max={customSizeMax}
                onChange={onCustomWidthChange}
                ariaLabel="Custom width in pixels"
              />
              <ScrubberInput
                label="Height"
                value={customHeight}
                min={customSizeMin}
                max={customSizeMax}
                onChange={onCustomHeightChange}
                ariaLabel="Custom height in pixels"
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
