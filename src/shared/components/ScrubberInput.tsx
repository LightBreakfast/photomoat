import { useCallback, useEffect, useRef, useState } from 'react'

type ScrubberInputLayout = 'stacked' | 'inline'

type ScrubberInputProps = {
  label: string
  value: number
  disabled?: boolean
  min?: number
  max?: number
  step?: number
  onChange: (value: number) => void
  ariaLabel: string
  layout?: ScrubberInputLayout
}

export function ScrubberInput({
  label,
  value,
  disabled,
  min = 1,
  max,
  step = 1,
  onChange,
  ariaLabel,
  layout = 'stacked',
}: ScrubberInputProps) {
  const [localValue, setLocalValue] = useState(String(value))
  const [isDragging, setIsDragging] = useState(false)
  const lastPropRef = useRef(value)
  const dragStartRef = useRef<{ x: number; startValue: number } | null>(null)

  useEffect(() => {
    if (lastPropRef.current !== value) {
      lastPropRef.current = value
      setLocalValue(String(value))
    }
  }, [value])

  const clampValue = useCallback(
    (v: number) => {
      let clamped = Math.round(v)
      if (min !== undefined) clamped = Math.max(min, clamped)
      if (max !== undefined) clamped = Math.min(max, clamped)
      return clamped
    },
    [min, max],
  )

  const commit = () => {
    const parsed = Number(localValue)

    if (Number.isFinite(parsed) && parsed >= min) {
      onChange(clampValue(parsed))
    } else {
      setLocalValue(String(lastPropRef.current))
    }
  }

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (disabled) return
      event.preventDefault()

      const startValue = value
      dragStartRef.current = { x: event.clientX, startValue }
      setIsDragging(true)

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!dragStartRef.current) return

        const deltaX = moveEvent.clientX - dragStartRef.current.x
        let multiplier = step
        if (moveEvent.shiftKey) multiplier *= 10
        if (moveEvent.altKey || moveEvent.metaKey) multiplier *= 0.1

        const newValue = clampValue(dragStartRef.current.startValue + deltaX * multiplier)
        setLocalValue(String(newValue))
        onChange(newValue)
      }

      const handleMouseUp = () => {
        dragStartRef.current = null
        setIsDragging(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [disabled, value, step, clampValue, onChange],
  )

  const isInline = layout === 'inline'

  return (
    <label
      className={
        isInline
          ? 'flex items-center justify-between gap-2 rounded-md px-1 text-xs font-medium text-muted select-none'
          : 'block min-w-0 space-y-1'
      }
    >
      <span
        onMouseDown={handleMouseDown}
        className={[
          isInline ? 'shrink-0' : 'inline-block px-1',
          'text-xs font-medium text-muted select-none',
          disabled
            ? 'cursor-not-allowed opacity-50'
            : isDragging
              ? 'cursor-ew-resize underline underline-offset-2 decoration-accent'
              : 'cursor-col-resize hover:text-foreground',
        ].join(' ')}
      >
        {label}
      </span>
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
        disabled={disabled}
        className={
          isInline
            ? 'w-16 rounded-md border border-border bg-background px-2 py-1.5 text-right text-sm tabular-nums disabled:cursor-not-allowed disabled:opacity-50'
            : 'w-full rounded-md border border-border bg-background px-2 py-1.5 text-right text-sm tabular-nums disabled:cursor-not-allowed disabled:opacity-50'
        }
        aria-label={ariaLabel}
      />
    </label>
  )
}
