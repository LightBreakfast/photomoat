import * as React from 'react'

import { cn } from '@/lib/utils'

const inputClassName = cn(
  'flex h-8 w-full rounded-md border border-border bg-background px-2.5 py-1.5',
  'text-sm text-foreground placeholder:text-muted-foreground',
  'outline-none transition-colors',
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
  'disabled:cursor-not-allowed disabled:opacity-50',
)

function Input({
  className,
  ...props
}: React.ComponentProps<'input'>) {
  return (
    <input
      className={cn(inputClassName, className)}
      {...props}
    />
  )
}

export { Input }
