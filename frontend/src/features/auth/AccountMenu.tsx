import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import LogoutIcon from '@mui/icons-material/Logout'

import { useAuth } from '@/features/auth/useAuth'
import { MOBILE_BREAKPOINT } from '@/app/theme'

/**
 * Shows who is signed in, and offers a way out.
 *
 * The name and phone come from `GET /auth/me`, not from the access token —
 * nothing displayed depends on the client interpreting a credential it cannot
 * verify.
 *
 * Responsive: below `md` the trigger is an icon button, since a name would
 * crowd out the page title on a phone. The name is still the first thing inside
 * the menu, so it is never unreachable — only one tap further away.
 */
export function AccountMenu() {
  const { user, signOut } = useAuth()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  if (!user) return null

  const close = () => setAnchorEl(null)

  async function handleSignOut() {
    close()
    await signOut()
  }

  return (
    <>
      {/* Phone: icon only. */}
      <IconButton
        color="inherit"
        aria-label="Account"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{ display: { xs: 'inline-flex', [MOBILE_BREAKPOINT]: 'none' } }}
      >
        <AccountCircleIcon />
      </IconButton>

      {/* Desktop: name beside the icon, where there is room for it. */}
      <Button
        color="inherit"
        startIcon={<AccountCircleIcon />}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          display: { xs: 'none', [MOBILE_BREAKPOINT]: 'inline-flex' },
          textTransform: 'none',
        }}
      >
        {user.fullName}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ px: 2, py: 1, minWidth: 200 }}>
          <Typography variant="subtitle2">{user.fullName}</Typography>
          <Typography variant="body2" color="text.secondary">
            {user.phone ?? 'No phone recorded'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user.role}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleSignOut}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sign out</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}
