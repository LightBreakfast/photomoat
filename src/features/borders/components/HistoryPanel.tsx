import { Redo2, Undo2 } from 'lucide-react'

import { WorkspaceFooterIconButton } from '@/features/borders/components/WorkspaceFooterIconButton'
import type { EditTimeline } from '@/features/borders/types'
import { cn } from '@/lib/utils'

type HistoryPanelProps = {
  timeline: EditTimeline | undefined
  onUndo: () => void
  onRedo: () => void
  onJump: (index: number) => void
  className?: string
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function HistoryPanel({
  timeline,
  onUndo,
  onRedo,
  onJump,
  className,
}: HistoryPanelProps) {
  // Hidden until at least one edit has been made — no empty states.
  if (!timeline || timeline.entries.length <= 1) {
    return null
  }

  const entries = timeline.entries
  const currentIndex = timeline.currentIndex
  const canUndo = currentIndex > 0
  const canRedo = currentIndex < entries.length - 1

  return (
    <section className={className}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">History</p>
        <div className="flex items-center gap-0.5">
          <WorkspaceFooterIconButton
            label="Undo"
            icon={Undo2}
            onClick={onUndo}
            disabled={!canUndo}
          />
          <WorkspaceFooterIconButton
            label="Redo"
            icon={Redo2}
            onClick={onRedo}
            disabled={!canRedo}
          />
        </div>
      </div>

      <ol className="mt-2 max-h-44 space-y-0.5 overflow-y-auto pr-1">
        {[...entries].reverse().map((entry, index) => {
          const entryIndex = entries.length - 1 - index
          const isCurrent = entryIndex === currentIndex
          const isFuture = entryIndex > currentIndex

          return (
            <li key={`${entry.timestamp}-${entryIndex}`}>
              <button
                type="button"
                onClick={() => onJump(entryIndex)}
                aria-current={isCurrent ? 'true' : undefined}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-xs transition-colors',
                  isCurrent
                    ? 'bg-accent/15 font-medium text-foreground'
                    : isFuture
                      ? 'text-muted opacity-60 hover:bg-surface-muted'
                      : 'text-muted hover:bg-surface-muted hover:text-foreground',
                )}
              >
                <span className="min-w-0 truncate">{entry.label}</span>
                <span className="shrink-0 tabular-nums opacity-70">
                  {formatTime(entry.timestamp)}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
