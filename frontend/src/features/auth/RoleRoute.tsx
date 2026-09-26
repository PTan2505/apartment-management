import { Navigate, Outlet, useLocation } from 'react-router'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'

import { startingPathFor } from '@/app/navigation'
import { useAuth } from '@/features/auth/useAuth'
import type { Role } from '@/features/auth/types'

/**
 * Two rules that decide what a signed-in person may open, both mirroring the
 * API rather than replacing it.
 *
 * FIRST: an account owing a password change goes to change it, and stays
 * there. The API refuses everything else anyway; this exists so the person is
 * told what to do instead of meeting a permission error they cannot act on.
 *
 * SECOND: a screen this role may not reach says so, with the way back. Typed
 * into the address bar, the alternative is a screen that loads and then fills
 * with failed requests, which reads as a fault rather than as a boundary.
 */
export function RoleRoute({ allow }: { allow: readonly Role[] }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) return null

  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }

  if (!allow.includes(user.role)) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert
          severity="info"
          action={
            <Button color="inherit" size="small" href={startingPathFor(user.role)}>
              Về trang chính
            </Button>
          }
        >
          <AlertTitle>Màn hình này không thuộc phần việc của bạn</AlertTitle>
          Tài khoản của bạn không mở được trang này. Nếu cần, hãy nhờ chủ nhà.
        </Alert>
      </Box>
    )
  }

  return <Outlet />
}
