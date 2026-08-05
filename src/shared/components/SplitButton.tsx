import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type SplitButtonProps = {
  label: string
  icon?: ReactNode
  disabled?: boolean
  onAction: () => void | Promise<void>
  /** Accessible name for the caret menu trigger. */
  menuLabel: string
  menuContent: ReactNode
  menuContentClassName?: string
}

const splitButtonPartClassName =
  'inline-flex items-center justify-center gap-2 bg-accent text-sm font-medium text-accent-foreground outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-3 focus-visible:ring-ring/50'

/** A primary action button with an attached settings dropdown trigger. */
export function SplitButton({
  label,
  icon,
  disabled = false,
  onAction,
  menuLabel,
  menuContent,
  menuContentClassName,
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

      <DropdownMenu disabled={disabled}>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              disabled={disabled}
              aria-label={menuLabel}
              className={`${splitButtonPartClassName} w-8 shrink-0 rounded-r-md border-l border-accent-foreground/20`}
            />
          }
        >
          <ChevronDown size={15} />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={4}
          className={menuContentClassName}
        >
          {menuContent}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
