import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import MenuIcon from '@mui/icons-material/Menu'

import { DESTINATIONS } from '@/app/navigation'
import { DRAWER_WIDTH, MOBILE_BREAKPOINT } from '@/app/theme'

/**
 * The responsive application shell.
 *
 * ─── The pattern every screen will reuse ────────────────────────────────────
 *
 *        ≥ md  (desktop)                 < md  (phone)
 *   ┌────────┬──────────────┐       ┌──────────────────┐
 *   │        │  AppBar      │       │ ☰   Buildings    │
 *   │  nav   ├──────────────┤       ├──────────────────┤
 *   │        │              │       │                  │
 *   │ perm-  │   <Outlet/>  │       │    <Outlet/>     │
 *   │ anent  │              │       │                  │
 *   └────────┴──────────────┘       └──────────────────┘
 *     always visible                  ☰ opens a drawer over
 *                                     the content; closes on
 *                                     select or backdrop tap
 *
 * Two things here are deliberate and easy to get wrong:
 *
 * 1. Both drawer variants are always mounted, and `sx.display` decides which is
 *    visible. The alternative — `useMediaQuery` returning a boolean and
 *    rendering one — evaluates to `false` on the very first render, so the
 *    desktop layout briefly paints the mobile one before correcting itself.
 *
 * 2. Selecting a destination closes the temporary drawer. Leaving it open is
 *    the single most common bug in hand-rolled versions: you navigate, and the
 *    drawer sits there covering the page you just navigated to.
 */
export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const activeDestination = DESTINATIONS.find((destination) =>
    location.pathname.startsWith(destination.path),
  )

  function handleNavigate(path: string) {
    navigate(path)
    // Close on select — see note 2 above.
    setMobileOpen(false)
  }

  const navigationList = (
    <List>
      {DESTINATIONS.map((destination) => {
        const Icon = destination.icon
        const isActive = destination.path === activeDestination?.path
        return (
          <ListItemButton
            key={destination.path}
            selected={isActive}
            onClick={() => handleNavigate(destination.path)}
          >
            <ListItemIcon>
              <Icon color={isActive ? 'primary' : undefined} />
            </ListItemIcon>
            <ListItemText primary={destination.label} />
          </ListItemButton>
        )
      })}
    </List>
  )

  const drawerContent = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap>
          Apartments
        </Typography>
      </Toolbar>
      <Divider />
      {navigationList}
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          // Mobile-first: full width by default, then inset by the drawer's
          // width once the permanent drawer appears.
          width: { [MOBILE_BREAKPOINT]: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { [MOBILE_BREAKPOINT]: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
            sx={{
              mr: 2,
              // Hidden once the navigation is permanently visible — offering a
              // control to open something already open is just confusing.
              display: { [MOBILE_BREAKPOINT]: 'none' },
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="h1">
            {activeDestination?.label ?? 'Apartment Management'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { [MOBILE_BREAKPOINT]: DRAWER_WIDTH }, flexShrink: 0 }}
      >
        {/* Mobile: slides over the content, dismissed by the backdrop. */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          // Keeps the DOM mounted between opens, which is smoother on mobile.
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', [MOBILE_BREAKPOINT]: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop: always visible, never dismissable. */}
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', [MOBILE_BREAKPOINT]: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, [MOBILE_BREAKPOINT]: 3 },
          // `minWidth: 0` is what actually prevents horizontal overflow. A flex
          // child defaults to `min-width: auto`, meaning it refuses to shrink
          // below its content — so one wide table would push the whole shell
          // sideways. With this, wide content scrolls inside its own container
          // instead of breaking the layout of every screen.
          minWidth: 0,
          width: { [MOBILE_BREAKPOINT]: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        {/* Offsets the fixed AppBar so content starts below it. */}
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  )
}
