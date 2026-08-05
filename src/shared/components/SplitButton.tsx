import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'

type SplitButtonProps = {
  label: string
  icon?: ReactNode
  disabled?: boolean
  onAction: () => void | Promise<void>
  /** Accessible name for the settings caret trigger. */
  caretLabel: string
  /** Content rendered inside the settings dialog. */
  dialogContent: ReactNode
  dialogContentClassName?: string
}

const splitButtonPartClassName =
  'inline-flex items-center justify-center gap-2 bg-accent text-sm font-medium text-accent-foreground outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-3 focus-visible:ring-ring/50'

/**
 * A primary action button with an attached settings trigger. The caret opens a
 * dialog (not a menu) so the settings surface can host form controls that
 * receive keyboard input normally.
 */
export function SplitButton({
  label,
  icon,
  disabled = false,
  onAction,
  caretLabel,
  dialogContent,
  dialogContentClassName,
}: SplitButtonProps) {
  return (
    <div className="flex w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => void onAction()}
        className={`${splitButtonPartClassName} flex-1 rounded-l-md px-3 py-1.5`}
      >
        {icon}
        {label}
      </button>

      <Dialog>
        <DialogTrigger
          render={
            <button
              type="button"
              disabled={disabled}
              aria-label={caretLabel}
              className={`${splitButtonPartClassName} w-8 shrink-0 rounded-r-md border-l border-accent-foreground/20`}
            />
          }
        >
          <ChevronDown size={15} />
        </DialogTrigger>

        <DialogContent className={dialogContentClassName}>
          {dialogContent}
        </DialogContent>
      </Dialog>
    </div>
  )
}
