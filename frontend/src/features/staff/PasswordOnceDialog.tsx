import { useState } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

/**
 * The generated password, shown once and said to be shown once.
 *
 * It lives in the caller's component state and never in the query cache:
 * cached, it would survive a navigation and be readable again, which is
 * exactly what the API refuses to allow by storing it hashed.
 *
 * The warning is not decoration. An owner who closes this without copying has
 * to reset the password — and the reset is what tells the employee their
 * password changed again, so it is worth one sentence here.
 */
export function PasswordOnceDialog({
  open,
  fullName,
  phone,
  password,
  onClose,
}: {
  open: boolean
  fullName: string
  phone: string | null
  password: string | null
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)

  async function copy() {
    setFailed(false)
    try {
      await navigator.clipboard.writeText(password ?? '')
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      setFailed(true)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Mật khẩu của {fullName}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="warning">
            <AlertTitle>Chỉ hiện một lần</AlertTitle>
            Đóng cửa sổ này là không xem lại được nữa. Chép lại rồi gửi cho nhân viên —
            quên thì phải cấp mật khẩu mới.
          </Alert>

          <TextField
            label="Số điện thoại đăng nhập"
            value={phone ?? ''}
            size="small"
            fullWidth
            slotProps={{ htmlInput: { readOnly: true } }}
          />
          <TextField
            label="Mật khẩu"
            value={password ?? ''}
            size="small"
            fullWidth
            slotProps={{
              htmlInput: { readOnly: true, style: { fontFamily: 'monospace', fontSize: '1.1rem' } },
            }}
            onFocus={(event) => event.target.select()}
          />

          <Button variant="contained" startIcon={<ContentCopyIcon />} onClick={() => void copy()}>
            {copied ? 'Đã chép' : 'Sao chép mật khẩu'}
          </Button>

          {failed && (
            <Alert severity="warning">
              Trình duyệt không cho sao chép tự động. Bấm vào ô mật khẩu rồi chép tay nhé.
            </Alert>
          )}

          <Typography variant="caption" color="text.secondary">
            Lần đầu đăng nhập, nhân viên sẽ được yêu cầu đổi mật khẩu này.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={onClose}>
          Tôi đã chép xong
        </Button>
      </DialogActions>
    </Dialog>
  )
}
