import { History, X } from 'lucide-react'

import { Button } from '@/components/ui/button'

type RestoreSessionBannerProps = {
  imageCount: number
  savedAt: number
  storageLabel?: string
  isRestoring?: boolean
  onRestore: () => void
  onClear: () => void
  onDismiss: () => void
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function RestoreSessionBanner({
  imageCount,
  savedAt,
  storageLabel,
  isRestoring = false,
  onRestore,
  onClear,
  onDismiss,
}: RestoreSessionBannerProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-surface px-4 py-2">
      <History size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Pick up where you left off?</span>{' '}
        {imageCount} image{imageCount === 1 ? '' : 's'} · saved {formatTime(savedAt)}
        {storageLabel ? ` · ${storageLabel}` : null}
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <Button size="sm" onClick={onRestore} disabled={isRestoring}>
          Restore
        </Button>
        <Button size="sm" variant="outline" onClick={onClear} disabled={isRestoring}>
          Clear saved
        </Button>
        <button
          type="button"
          onClick={onDismiss}
          disabled={isRestoring}
          aria-label="Dismiss — keep saved session for next time"
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
