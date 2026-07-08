import { useEffect, useRef, useState } from 'react'
import { Palette } from 'lucide-react'

import type { ImageSizingMode } from '@/features/borders/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const swatches = ['#ffffff', '#000000', '#f5f5f5', '#e2e2e2', '#d4d4d4', '#1a1a1a']

type BorderControlsProps = {
  backgroundColor: string
  imageSizingMode: ImageSizingMode
  imageEdgePixels: number
  borderWidthPixels: number
  onBackgroundColorChange: (color: string) => void
  onImageSizingModeChange: (mode: ImageSizingMode) => void
  onImageEdgePixelsChange: (pixels: number) => void
  onBorderWidthPixelsChange: (pixels: number) => void
}

function isEdgeSizingMode(mode: ImageSizingMode) {
  return mode === 'long-edge' || mode === 'short-edge'
}

function UncontrolledNumberInput({
  label,
  value,
  disabled,
  min = 1,
  onChange,
  ariaLabel,
}: {
  label: string
  value: number
  disabled?: boolean
  min?: number
  onChange: (value: number) => void
  ariaLabel: string
}) {
  const [localValue, setLocalValue] = useState(String(value))
  const lastPropRef = useRef(value)

  useEffect(() => {
    if (lastPropRef.current !== value) {
      lastPropRef.current = value
      setLocalValue(String(value))
    }
  }, [value])

  const commit = () => {
    const parsed = Number(localValue)

    if (Number.isFinite(parsed) && parsed >= min) {
      onChange(Math.round(parsed))
    } else {
      setLocalValue(String(lastPropRef.current))
    }
  }

  if (disabled) {
    return null
  }

  return (
    <label className="block">
      <span className="text-xs font-medium text-muted">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        value={localValue}
        onChange={(event) => setLocalValue(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            commit()
          }
        }}
        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        aria-label={ariaLabel}
      />
    </label>
  )
}

export function BorderControls({
  backgroundColor,
  imageSizingMode,
  imageEdgePixels,
  borderWidthPixels,
  onBackgroundColorChange,
  onImageSizingModeChange,
  onImageEdgePixelsChange,
  onBorderWidthPixelsChange,
}: BorderControlsProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          Background
        </p>
        <div className="flex flex-wrap gap-1.5">
          {swatches.map((swatch) => (
            <button
              key={swatch}
              type="button"
              aria-label={`Use ${swatch} background`}
              aria-pressed={swatch.toLowerCase() === backgroundColor.toLowerCase()}
              onClick={() => onBackgroundColorChange(swatch)}
              className="h-7 w-7 rounded-md border border-border"
              style={{ backgroundColor: swatch }}
            />
          ))}
          <label className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-border text-muted hover:text-foreground">
            <Palette size={14} />
            <input
              type="color"
              value={backgroundColor}
              onChange={(event) => onBackgroundColorChange(event.target.value)}
              className="sr-only"
              aria-label="Pick custom background colour"
            />
          </label>
        </div>
        <input
          type="text"
          value={backgroundColor}
          onChange={(event) => onBackgroundColorChange(event.target.value)}
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          inputMode="text"
          aria-label="Background colour hex value"
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          Image sizing
        </p>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted">Mode</span>
          <Select
            value={imageSizingMode}
            onValueChange={(value) => onImageSizingModeChange(value as ImageSizingMode)}
          >
            <SelectTrigger className="w-full" aria-label="Image sizing mode">
              <SelectValue>
                {(value: string) => {
                  const labels: Record<string, string> = {
                    contain: 'Auto fit',
                    'long-edge': 'Long edge',
                    'short-edge': 'Short edge',
                    'border-width': 'Border width',
                  }
                  return labels[value] ?? value
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contain">Auto fit</SelectItem>
              <SelectItem value="long-edge">Long edge</SelectItem>
              <SelectItem value="short-edge">Short edge</SelectItem>
              <SelectItem value="border-width">Border width</SelectItem>
            </SelectContent>
          </Select>
        </label>

        <UncontrolledNumberInput
          label="Edge size (px)"
          value={imageEdgePixels}
          disabled={!isEdgeSizingMode(imageSizingMode)}
          onChange={onImageEdgePixelsChange}
          ariaLabel="Target edge size in pixels"
        />

        <UncontrolledNumberInput
          label="Border width (px)"
          value={borderWidthPixels}
          disabled={imageSizingMode !== 'border-width'}
          onChange={onBorderWidthPixelsChange}
          ariaLabel="Border width in pixels"
        />
      </div>
    </div>
  )
}
