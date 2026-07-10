import { Grid3X3, Search } from 'lucide-react'

import { cn } from '@/lib/utils'

type WorkspaceModeToggleProps = {
  mode: 'browse' | 'inspect'
  onChange: (mode: 'browse' | 'inspect') => void
  disabled?: boolean
  size?: 'default' | 'compact'
}

export function WorkspaceModeToggle({
  mode,
  onChange,
  disabled = false,
  size = 'default',
}: WorkspaceModeToggleProps) {
  const isCompact = size === 'compact'

  return (
    <div
      role="radiogroup"
      aria-label="Workspace mode"
      className={cn('inline-flex items-center gap-1', isCompact && 'h-8')}
    >
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'browse'}
        onClick={() => onChange('browse')}
        disabled={disabled}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          isCompact ? 'h-8 px-2.5 text-xs leading-none' : 'h-8 px-3 text-xs',
          mode === 'browse'
            ? 'border-border bg-background text-foreground shadow-sm'
            : 'border-transparent text-muted hover:bg-surface-muted hover:text-foreground',
        )}
      >
        <Grid3X3 size={12} aria-hidden="true" />
        Browse
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'inspect'}
        onClick={() => onChange('inspect')}
        disabled={disabled}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          isCompact ? 'h-8 px-2.5 text-xs leading-none' : 'h-8 px-3 text-xs',
          mode === 'inspect'
            ? 'border-border bg-background text-foreground shadow-sm'
            : 'border-transparent text-muted hover:bg-surface-muted hover:text-foreground',
        )}
      >
        <Search size={12} aria-hidden="true" />
        Inspect
      </button>
    </div>
  )
}
