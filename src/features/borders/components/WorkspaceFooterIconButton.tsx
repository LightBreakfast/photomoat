import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Kbd } from '@/components/ui/kbd'
import { Tooltip } from '@/shared/components/Tooltip'

/** Renders a shortcut hint like `⌘[` on macOS and `Ctrl+[` elsewhere. */
function formatShortcut(shortcut: string): string {
  const isMac =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
  return isMac ? `⌘${shortcut}` : `Ctrl+${shortcut}`
}

type WorkspaceFooterIconButtonProps = {
  label: string
  icon: LucideIcon
  shortcut?: string
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
  shortcut,
  onClick,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  disabled = false,
  pressed,
}: WorkspaceFooterIconButtonProps) {
  return (
    <Tooltip
      label={
        shortcut ? (
          <>
            {label}
            <Kbd>{formatShortcut(shortcut)}</Kbd>
          </>
        ) : (
          label
        )
      }
    >
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
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors',
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
