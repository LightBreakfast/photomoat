import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from '@/app/App'
import { ThemeProvider } from '@/app/providers/ThemeProvider'
import { TooltipProviderWrapper } from '@/shared/components/Tooltip'
import '@/styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <TooltipProviderWrapper>
        <App />
      </TooltipProviderWrapper>
    </ThemeProvider>
  </StrictMode>,
)
