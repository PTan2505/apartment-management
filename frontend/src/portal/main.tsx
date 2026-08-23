import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'

import { theme } from '@/app/theme'
import { PortalApp } from '@/portal/PortalApp'

/**
 * The tenant portal's entry point.
 *
 * Notice what is absent: no router — there is one screen and nothing to
 * navigate to; no query client — three calls, none of them cached across a
 * screen that does not exist; no auth provider — there is nothing to log into.
 *
 * The theme is shared with the owner's application, so a tenant's bill looks
 * like it came from the same system. Nothing else is.
 */
const container = document.getElementById('root')
if (!container) throw new Error('Root element #root was not found')

createRoot(container).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PortalApp />
    </ThemeProvider>
  </StrictMode>,
)
