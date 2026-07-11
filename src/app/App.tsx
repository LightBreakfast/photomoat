import { useState } from 'react'
import { Info } from 'lucide-react'

import { BorderToolPage } from '@/features/borders/BorderToolPage'
import { GitHubMarkIcon } from '@/shared/components/icons/GitHubMarkIcon'
import { ThemeToggle } from '@/shared/components/ThemeToggle'

export default function App() {
  const [infoOpen, setInfoOpen] = useState(false)

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
        <p className="text-sm font-semibold tracking-tight text-foreground">
          PhotoMoat
        </p>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/LightBreakfast/photomoat"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted hover:text-foreground"
            aria-label="Open PhotoMoat GitHub repository"
          >
            <GitHubMarkIcon className="size-4" />
          </a>
          <div className="relative">
            <button
              type="button"
              onClick={() => setInfoOpen((open) => !open)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted hover:text-foreground"
              aria-label="About PhotoMoat"
              aria-expanded={infoOpen}
            >
              <Info size={16} />
            </button>

            {infoOpen ? (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setInfoOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 top-10 z-20 w-72 border border-border bg-surface p-4 shadow-lg">
                  <p className="text-sm font-semibold text-foreground">PhotoMoat</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    All image processing happens in your browser. Nothing is uploaded to any server.
                    Export Instagram-ready bordered images individually or as a ZIP batch.
                  </p>
                </div>
              </>
            ) : null}
          </div>
          <ThemeToggle />
        </div>
      </header>

      <BorderToolPage />
    </div>
  )
}
