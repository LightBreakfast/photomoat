import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
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
      <Button
        disabled={disabled}
        onClick={() => void onAction()}
        className="flex-1 rounded-l-md"
      >
        {icon}
        {label}
      </Button>

      <Dialog>
        <DialogTrigger
          render={
            <Button
              disabled={disabled}
              aria-label={caretLabel}
              aria-haspopup="dialog"
              className="w-8 shrink-0 rounded-r-md border-l border-primary-foreground/20"
              size="icon"
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
