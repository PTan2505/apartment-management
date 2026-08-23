import { createTheme } from '@mui/material/styles'

/**
 * Breakpoints are MUI's defaults, listed explicitly because the whole
 * responsive strategy hangs off one of them.
 *
 *   xs  0     phone, portrait
 *   sm  600   phone, landscape / small tablet
 *   md  900   ← the only divide this application uses
 *   lg  1200
 *   xl  1536
 *
 * The layout genuinely has two forms — navigation beside the content, or
 * navigation hidden behind a button — so it uses one breakpoint rather than
 * five. Inventing intermediate forms creates states nobody checks.
 */
export const MOBILE_BREAKPOINT = 'md' as const

/** Width of the navigation drawer, shared by both its variants. */
export const DRAWER_WIDTH = 240

/*
 * Note on horizontal overflow: there is deliberately no `body { overflow-x:
 * hidden }` here. That hides overflow rather than preventing it, so a genuinely
 * too-wide element is silently clipped instead of being visibly wrong — which
 * makes the bug harder to find, not absent. The actual mechanism is `minWidth:
 * 0` on the flex content area in AppShell (see the comment there), plus each
 * screen wrapping its own wide content in an `overflow-x: auto` container.
 */

export const theme = createTheme({
  palette: {
    mode: 'light',
  },
})
