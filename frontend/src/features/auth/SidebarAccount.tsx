import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import LogoutIcon from '@mui/icons-material/Logout'

import { useAuth } from '@/features/auth/useAuth'
import { initials, phoneLabel, roleLabel } from '@/features/auth/labels'

/**
 * Who is signed in, at the foot of the navigation.
 *
 * Three facts, and each answers a different question. The name answers "is this
 * my account". The role answers "why can I see this" — a tenant will eventually
 * sign in here too, and a screen that never says which kind of account is
 * looking leaves that to be inferred from whatever happens to be on it. The
 * phone answers "WHICH account", and it is the only one of the three guaranteed
 * to be distinct: two owners may share a name, none share the number they sign
 * in with.
 */
export function SidebarAccount() {
  const { user, signOut } = useAuth()

  if (!user) return null

  return (
    <Box>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: 'primary.main',
              fontSize: '0.8125rem',
              fontWeight: 600,
            }}
          >
            {initials(user.fullName)}
          </Avatar>
          {/*
            minWidth: 0 on both this and the row above it. Without it a long
            name refuses to shrink below its own width and pushes the avatar out
            of the drawer instead of ellipsising.
          */}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap title={user.fullName}>
              {user.fullName}
            </Typography>
            {/*
              Role and phone on one line, under the name, as the design has
              them. Given their own row they start at the panel's edge instead
              of the name's, and read as a separate thing about the account
              rather than as part of the same identity.
            */}
            <Typography variant="caption" color="text.secondary" component="div" noWrap>
              {roleLabel(user.role)} · {phoneLabel(user)}
            </Typography>
          </Box>
        </Stack>

        <Button
          fullWidth
          size="small"
          startIcon={<LogoutIcon />}
          onClick={() => void signOut()}
          sx={{ mt: 1.5, justifyContent: 'flex-start' }}
        >
          Đăng xuất
        </Button>
      </Box>
    </Box>
  )
}
