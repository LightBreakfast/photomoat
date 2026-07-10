import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Tooltip } from '@/shared/components/Tooltip'

type WorkspaceFooterIconButtonProps = {
  label: string
  icon: LucideIcon
  onClick?: () => void
  onPointerDown?: () => void
  onPointerUp?: () => void
  onPointerLeave?: () => void
  onPointerCancel?: () => void
  disabled?: boolean
  pressed?: boolean
}

export function WorkspaceFooterIconButton({
  label,
  icon: Icon,
  onClick,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  disabled = false,
  pressed,
}: WorkspaceFooterIconButtonProps) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={pressed}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        onPointerCancel={onPointerCancel}
        disabled={disabled}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-md border transition-colors',
          disabled && 'cursor-not-allowed opacity-40',
          pressed
            ? 'border-accent bg-surface-muted text-foreground'
            : 'border-transparent text-muted hover:bg-surface-muted hover:text-foreground active:bg-surface-muted',
        )}
      >
        <Icon size={14} />
      </button>
    </Tooltip>
  )
}
