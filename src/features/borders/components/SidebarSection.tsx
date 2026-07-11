import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'

type SidebarSectionProps = {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

export function SidebarSection({ title, defaultOpen = true, children }: SidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const contentId = useId()
  const labelId = `${contentId}-label`

  return (
    <section aria-labelledby={labelId} className="space-y-3">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        id={labelId}
        className="flex w-full items-center justify-between rounded-md px-0.5 py-1 text-xs font-medium uppercase tracking-wider text-muted hover:text-foreground"
      >
        {title}
        <ChevronDown
          size={14}
          className={isOpen ? 'rotate-0 transition-transform' : '-rotate-90 transition-transform'}
          aria-hidden="true"
        />
      </button>

      {isOpen ? <div id={contentId}>{children}</div> : null}
    </section>
  )
}
