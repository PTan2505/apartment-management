import { useState } from 'react'
import { useNavigate } from 'react-router'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { errorMessage } from '@/lib/error-messages'
import * as authApi from '@/features/auth/api'
import { useAuth } from '@/features/auth/useAuth'
import { startingPathFor } from '@/app/navigation'

/**
 * Changing your own password — and the screen a new employee meets first.
 *
 * It says WHY when the change is owed. A screen that demands a new password
 * without explaining reads as an obstacle; the reason is simple and worth one
 * sentence: the password was issued by the owner, so two people know it.
 *
 * Reachable by anyone signed in, from their own name, because an owner who
 * suspects their password is known needs the same thing.
 */
export function ChangePasswordPage() {
  const { user: account, refreshAccount } = useAuth()
  const navigate = useNavigate()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  /*
    A first change asks for the new password only.

    The person typed the issued one moments ago to get here, and it was chosen
    by somebody else and read to them — repeating it proves nothing the sign-in
    did not, and strands anybody who mistypes a string they never picked.

    Everywhere else the current one is required, because an access token left
    behind on a shared machine must not be enough to take an account over.
  */
  const owed = account?.mustChangePassword === true
  const tooShort = newPassword !== '' && newPassword.length < 8
  const mismatch = repeat !== '' && repeat !== newPassword
  const ready =
    (owed || currentPassword !== '') && newPassword.length >= 8 && repeat === newPassword

  async function submit() {
    setError(null)
    setBusy(true)
    try {
      await authApi.changePassword({
        newPassword,
        ...(owed ? {} : { currentPassword }),
      })
      // The account carries `mustChangePassword`; until it is re-read the
      // guard would send the person straight back here.
      await refreshAccount()
      setDone(true)
      navigate(startingPathFor(account?.role ?? 'owner'), { replace: true })
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', py: 4 }}>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2.5}>
            <Typography variant="h6">Đổi mật khẩu</Typography>

            {owed && (
              <Alert severity="warning">
                <AlertTitle>Cần đổi mật khẩu trước khi làm việc</AlertTitle>
                Mật khẩu hiện tại do chủ nhà cấp, nghĩa là có hai người biết. Đặt mật khẩu
                của riêng bạn rồi mới dùng được các màn hình khác.
              </Alert>
            )}

            {error && <Alert severity="error">{error}</Alert>}
            {done && <Alert severity="success">Đã đổi mật khẩu.</Alert>}

            {!owed && (
              <TextField
                label="Mật khẩu hiện tại"
                type="password"
                autoFocus
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            )}
            <TextField
              label="Mật khẩu mới"
              type="password"
              autoFocus={owed}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              error={tooShort}
              helperText={tooShort ? 'Tối thiểu 8 ký tự.' : 'Tối thiểu 8 ký tự.'}
            />
            <TextField
              label="Nhập lại mật khẩu mới"
              type="password"
              value={repeat}
              onChange={(event) => setRepeat(event.target.value)}
              error={mismatch}
              helperText={mismatch ? 'Hai ô chưa giống nhau.' : ' '}
            />

            <Typography variant="caption" color="text.secondary">
              Đổi xong, các thiết bị khác đang đăng nhập bằng tài khoản này sẽ bị đăng xuất.
            </Typography>

            <Button
              variant="contained"
              onClick={() => void submit()}
              disabled={!ready || busy}
              startIcon={busy ? <CircularProgress size={18} color="inherit" /> : undefined}
            >
              {busy ? 'Đang đổi…' : 'Đổi mật khẩu'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
