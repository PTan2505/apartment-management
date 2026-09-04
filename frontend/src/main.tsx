import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'

/*
 * Be Vietnam Pro, self-hosted. Only the four weights the theme actually names
 * are imported — every extra weight is a font file a phone has to fetch before
 * it can read the screen. Each file carries the Vietnamese subset, which is
 * why tone marks and the đồng sign are drawn in this face rather than falling
 * back to whatever the device happens to have.
 */
import '@fontsource/be-vietnam-pro/400.css'
import '@fontsource/be-vietnam-pro/500.css'
import '@fontsource/be-vietnam-pro/600.css'
import '@fontsource/be-vietnam-pro/700.css'

import { queryClient } from '@/app/query-client'
import { router } from '@/app/router'
import { theme } from '@/app/theme'

const container = document.getElementById('root')
if (!container) throw new Error('Root element #root was not found')

createRoot(container).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      {/* Normalises browser defaults and applies the theme's background. */}
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
