import { useRef, useState } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import DeleteIcon from '@mui/icons-material/Delete'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import UploadFileIcon from '@mui/icons-material/UploadFile'

import { isApiError } from '@/lib/api-error'
import { useQueryClient } from '@tanstack/react-query'
import * as leasesApi from '@/features/leases/api'
import { CONTRACT_ACCEPT } from '@/features/leases/api'
import type { Lease } from '@/features/leases/types'

/**
 * The signed contract for a tenancy.
 *
 * ── Why the file does not go through the API ───────────────────────────────
 *
 * A scan is megabytes uploaded from a phone. The API signs a URL, the BROWSER
 * sends the bytes straight to storage, and only then does the API record it —
 * so no request is held open for the length of an upload.
 *
 * That is three steps, and the middle one can fail on its own: the connection
 * drops, the tab closes, storage refuses the file. Nothing is recorded until
 * the third step confirms the object really arrived, which is why a failure
 * here leaves the tenancy exactly as it was rather than claiming a contract
 * that is not there.
 */
export function ContractCard({ lease }: { lease: Lease }) {
  const queryClient = useQueryClient()
  const fileInput = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<'uploading' | 'opening' | 'removing' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ['leases'] })
  }

  async function handleFile(file: File) {
    setError(null)
    setBusy('uploading')
    try {
      // 1. The API signs a URL. It chooses the destination; we name only a kind
      //    of file.
      const signed = await leasesApi.signContractUpload(lease.id, file.type)

      // Checked here as well as at confirmation, so a large file is refused
      // before it is uploaded rather than after — the upload is the slow part.
      if (file.size > signed.maxBytes) {
        throw new Error(
          `Tệp vượt quá ${Math.round(signed.maxBytes / 1024 / 1024)} MB`,
        )
      }

      // 2. The bytes go straight to storage.
      await leasesApi.uploadToStorage(signed, file)

      // 3. Only now is anything recorded, and the API asks storage whether the
      //    object is really there rather than believing us.
      await leasesApi.confirmContract(lease.id, signed.key)
      refresh()
    } catch (cause) {
      setError(
        isApiError(cause)
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : 'Không tải lên được tệp này.',
      )
    } finally {
      setBusy(null)
      // Cleared so choosing the same file again still fires a change event.
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  async function open() {
    setError(null)
    setBusy('opening')
    try {
      const { url } = await leasesApi.getContractUrl(lease.id)
      // A new tab rather than a download: the link is short-lived and the
      // owner is usually only checking what it says.
      window.open(url, '_blank', 'noopener')
    } catch (cause) {
      setError(isApiError(cause) ? cause.message : 'Không mở được hợp đồng.')
    } finally {
      setBusy(null)
    }
  }

  async function remove() {
    setError(null)
    setBusy('removing')
    try {
      await leasesApi.removeContract(lease.id)
      setConfirmRemove(false)
      refresh()
    } catch (cause) {
      setError(isApiError(cause) ? cause.message : 'Không xoá được hợp đồng.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">Bản hợp đồng đã ký</Typography>

          {error && <Alert severity="error">{error}</Alert>}

          {/*
            Said out loud rather than shown as a failed action. Storage being
            unconfigured is a state of this deployment, not a fault of the
            owner's, and an action that cannot work is worse than no action.
          */}
          {!lease.contractStorageAvailable ? (
            <Alert severity="info">
              <AlertTitle>Máy chủ chưa cấu hình nơi lưu trữ</AlertTitle>
              Chưa thể lưu bản scan hợp đồng ở đây. Mọi chức năng khác vẫn hoạt
              động bình thường.
            </Alert>
          ) : lease.hasContract ? (
            <>
              <Typography variant="body2" color="text.secondary">
                Đã có bản scan trên hệ thống. Đường dẫn xem chỉ có hiệu lực vài
                phút, nên không thể chia sẻ lâu dài.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  variant="outlined"
                  startIcon={<OpenInNewIcon />}
                  disabled={busy !== null}
                  onClick={() => void open()}
                >
                  {busy === 'opening' ? 'Đang mở…' : 'Xem hợp đồng'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<UploadFileIcon />}
                  disabled={busy !== null}
                  onClick={() => fileInput.current?.click()}
                >
                  {busy === 'uploading' ? 'Đang tải lên…' : 'Thay bản khác'}
                </Button>
                <Button
                  color="error"
                  startIcon={<DeleteIcon />}
                  disabled={busy !== null}
                  onClick={() => setConfirmRemove(true)}
                >
                  Xoá
                </Button>
              </Stack>
            </>
          ) : (
            <>
              {/*
                The limits are stated BEFORE a file is chosen. Learning them by
                having a file rejected after it uploaded is learning them at the
                most expensive moment.
              */}
              <Typography variant="body2" color="text.secondary">
                Chưa có bản scan nào. Nhận tệp PDF hoặc ảnh (JPG, PNG, HEIC), tối
                đa 20 MB.
              </Typography>
              <Box>
                <Button
                  variant="contained"
                  startIcon={
                    busy === 'uploading' ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <UploadFileIcon />
                    )
                  }
                  disabled={busy !== null}
                  onClick={() => fileInput.current?.click()}
                >
                  {busy === 'uploading' ? 'Đang tải lên…' : 'Tải hợp đồng lên'}
                </Button>
              </Box>
            </>
          )}

          <input
            ref={fileInput}
            type="file"
            accept={CONTRACT_ACCEPT}
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleFile(file)
            }}
          />
        </Stack>
      </CardContent>

      <Dialog open={confirmRemove} onClose={() => setConfirmRemove(false)} fullWidth maxWidth="xs">
        <DialogTitle>Xoá bản hợp đồng?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tệp sẽ bị xoá khỏi kho lưu trữ. Không hoàn tác được — nếu cần, bạn
            phải tải lên lại từ bản gốc.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmRemove(false)} disabled={busy === 'removing'}>
            Giữ lại
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => void remove()}
            disabled={busy === 'removing'}
          >
            {busy === 'removing' ? 'Đang xoá…' : 'Xoá'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}
