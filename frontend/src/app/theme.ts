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

/**
 * ── Where these values come from ───────────────────────────────────────────
 *
 * Four colours were STATED by the design: primary #0F766E, secondary #334155,
 * tertiary #9C573A, neutral #64748B. Three of the four are Tailwind ramp
 * values — teal-700, slate-700, slate-500 — so the greys the design did not
 * state (page ground, dividers, body text) are taken from the same slate ramp
 * rather than invented. A guess drawn from the palette the designer was
 * already using is likelier to be right than a guess drawn from nowhere.
 *
 * Everything below marked "estimated" was read off pixels rather than stated,
 * and is worth replacing with the real number from Stitch's CSS export.
 */

const slate = {
  50: '#F8FAFC',
  100: '#F1F5F9',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#94A3B8',
  500: '#64748B', // stated as "Neutral"
  600: '#475569',
  700: '#334155', // stated as "Secondary"
  800: '#1E293B',
  900: '#0F172A',
} as const

/**
 * A third accent, named by the design and belonging to no MUI slot.
 *
 * Mapping it onto `warning` would have been cheaper, and wrong: warning means
 * something to a reader, and a colour that means "warning" cannot also be used
 * for an ordinary secondary action without one of the two lying.
 */
declare module '@mui/material/styles' {
  interface Palette {
    tertiary: Palette['primary']
  }
  interface PaletteOptions {
    tertiary?: PaletteOptions['primary']
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    tertiary: true
  }
}

export const theme = createTheme({
  palette: {
    mode: 'light',

    primary: {
      main: '#0F766E',
      light: '#0D9488',
      dark: '#115E59',
      contrastText: '#FFFFFF',
    },

    secondary: {
      main: slate[700],
      light: slate[600],
      dark: slate[800],
      contrastText: '#FFFFFF',
    },

    tertiary: {
      main: '#9C573A',
      light: '#B87355',
      dark: '#7C4429',
      contrastText: '#FFFFFF',
    },

    // Estimated. The design shows a red icon button but does not name the
    // value; this is the Tailwind red that sits at the same depth as the
    // stated colours, so it belongs to the same family rather than shouting
    // over them.
    error: { main: '#B91C1C', light: '#DC2626', dark: '#991B1B' },
    warning: { main: '#B45309', light: '#D97706', dark: '#92400E' },
    success: { main: '#15803D', light: '#16A34A', dark: '#166534' },
    info: { main: '#0369A1', light: '#0284C7', dark: '#075985' },

    grey: slate,

    text: {
      primary: slate[900],
      secondary: slate[500],
      disabled: slate[400],
    },

    divider: slate[300],

    background: {
      // Estimated. The design board sets its cards on a tinted ground, but a
      // presentation board is not a screen — a real screen has one content
      // area, not a grid of specimens. Slate-100 keeps the tint without
      // carrying over a layout that only existed to show swatches.
      default: slate[100],
      paper: '#FFFFFF',
    },
  },

  shape: {
    // Estimated from the buttons and inputs. Cards read larger and are set
    // separately below.
    borderRadius: 8,
  },

  typography: {
    /*
     * Be Vietnam Pro, self-hosted through @fontsource rather than fetched from
     * Google's CDN. Two reasons, both about what a reader sees: a CDN request
     * that is slow or blocked shows the whole interface in a fallback face and
     * then swaps it, and this application must work for a landlord on a phone
     * with a poor connection.
     *
     * The face was chosen by the design and it is the right one: its Vietnamese
     * subset covers the tone marks AND U+20AB, the đồng sign, so every amount
     * on screen is drawn in the same face as the words beside it.
     */
    fontFamily: [
      '"Be Vietnam Pro"',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'system-ui',
      'sans-serif',
    ].join(','),

    // The design distinguishes Headline / Body / Label by weight within one
    // family, so hierarchy here is weight and size — not colour, and not a
    // second family.
    h1: { fontWeight: 700, fontSize: '2.25rem', lineHeight: 1.2, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, fontSize: '1.75rem', lineHeight: 1.25, letterSpacing: '-0.015em' },
    h3: { fontWeight: 600, fontSize: '1.5rem', lineHeight: 1.3, letterSpacing: '-0.01em' },
    h4: { fontWeight: 600, fontSize: '1.25rem', lineHeight: 1.35 },
    h5: { fontWeight: 600, fontSize: '1.125rem', lineHeight: 1.4 },
    h6: { fontWeight: 600, fontSize: '1rem', lineHeight: 1.45 },

    subtitle1: { fontWeight: 600, fontSize: '0.9375rem' },
    subtitle2: { fontWeight: 600, fontSize: '0.8125rem' },

    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.55 },

    caption: { fontSize: '0.75rem', lineHeight: 1.4 },

    // The design's buttons read "Primary", "Label" — sentence case, not
    // SHOUTED. MUI capitalises by default, so this has to be switched off.
    button: { fontWeight: 600, fontSize: '0.875rem', textTransform: 'none' },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          // Vietnamese sits low and tall at once — tone marks above, hooks and
          // dots below. Letting the browser choose optical sizing keeps that
          // from crowding at small sizes.
          textRendering: 'optimizeLegibility',
        },
      },
    },

    MuiButton: {
      defaultProps: {
        // The design is flat throughout: no gradient, no lift, no glow. An
        // elevated button would be the only raised object on screen.
        disableElevation: true,
      },
      styleOverrides: {
        root: { borderRadius: 8 },
        sizeMedium: { paddingTop: 7, paddingBottom: 7 },
      },
    },

    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none' },
        // Estimated. Cards in the design read noticeably rounder than the
        // buttons sitting inside them.
        rounded: { borderRadius: 12 },
      },
    },

    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: { root: { borderRadius: 12 } },
    },

    MuiOutlinedInput: {
      styleOverrides: { root: { borderRadius: 8 } },
    },

    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 600 },
        sizeSmall: { fontSize: '0.75rem' },
      },
    },

    /*
     * Table density and figure alignment come from the written brief rather
     * than from the design board, which showed a component set and no table.
     * They are stated here because the invoice screen is the densest thing in
     * the product and a default-height MUI table makes it four screens long.
     */
    MuiTableCell: {
      styleOverrides: {
        root: {
          paddingTop: 10,
          paddingBottom: 10,
          borderBottomColor: slate[200],
          // Columns of money only scan when the digits line up.
          fontVariantNumeric: 'tabular-nums',
        },
        head: {
          fontWeight: 600,
          fontSize: '0.75rem',
          letterSpacing: '0.04em',
          color: slate[500],
          backgroundColor: slate[50],
        },
      },
    },

    // Flat surfaces separated by a line rather than a shadow, matching the
    // design's treatment everywhere else.
    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'inherit' },
      styleOverrides: {
        root: { borderBottom: `1px solid ${slate[200]}`, backgroundColor: '#FFFFFF' },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: { borderRight: `1px solid ${slate[200]}`, backgroundColor: '#FFFFFF' },
      },
    },

    // The design marks the active navigation item as a tinted row, not a bar
    // down its left edge.
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': {
            backgroundColor: '#E6F2F0',
            '&:hover': { backgroundColor: '#D8EBE8' },
          },
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: slate[800], fontSize: '0.75rem' },
      },
    },
  },
})
