import type { ReactNode } from 'react'
import {
  Tooltip as ShadcnTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type TooltipProps = {
  label: string
  children: ReactNode
}

export function TooltipProviderWrapper({ children }: { children: ReactNode }) {
  return <TooltipProvider>{children}</TooltipProvider>
}

export function Tooltip({ label, children }: TooltipProps) {
  return (
    <ShadcnTooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        {children}
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={4}>
        {label}
      </TooltipContent>
    </ShadcnTooltip>
  )
}
