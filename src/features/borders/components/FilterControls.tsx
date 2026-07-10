import { Contrast } from 'lucide-react'

import type { FilterPresetId } from '@/features/borders/types'
import { filterPresets, getFilterPresetById } from '@/features/borders/filterPresets'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type FilterControlsProps = {
  selectedPresetId: FilterPresetId
  isCompareActive?: boolean
  onPresetChange: (presetId: FilterPresetId) => void
  onCompareStart: () => void
  onCompareEnd: () => void
}

function FilterIcon({ className }: { className?: string }) {
  return <Contrast size={14} className={className} />
}

export function FilterControls({
  selectedPresetId,
  isCompareActive = false,
  onPresetChange,
  onCompareStart,
  onCompareEnd,
}: FilterControlsProps) {
  const selectedPreset = getFilterPresetById(selectedPresetId)

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">
        Filters
      </p>

      <div className="overflow-hidden rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        <Select
          value={selectedPresetId}
          onValueChange={(value) => onPresetChange(value as FilterPresetId)}
        >
          <SelectTrigger
            className="h-auto min-h-12 w-full rounded-none border-0 px-3 py-2.5 shadow-none focus-visible:ring-0"
            aria-label="Filter preset"
          >
            <SelectValue>
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted">
                  <FilterIcon />
                </span>
                <span className="truncate text-sm font-medium text-foreground">
                  {selectedPreset.label}
                </span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {filterPresets.map((preset) => (
              <SelectItem
                key={preset.id}
                value={preset.id}
                className="pr-2 [&>span:last-child]:hidden"
              >
                <div className="min-w-0 flex-1 py-0.5">
                  <div className="truncate font-medium text-foreground">
                    {preset.label}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <button
        type="button"
        aria-pressed={isCompareActive}
        onPointerDown={onCompareStart}
        onPointerUp={onCompareEnd}
        onPointerLeave={onCompareEnd}
        onPointerCancel={onCompareEnd}
        className={[
          'w-full rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
          isCompareActive
            ? 'border-accent bg-surface-muted text-foreground'
            : 'border-border bg-surface text-muted hover:text-foreground active:bg-surface-muted',
        ].join(' ')}
      >
        Hold to compare
      </button>
    </div>
  )
}
