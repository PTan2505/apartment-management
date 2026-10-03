import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import DescriptionIcon from '@mui/icons-material/Description'

import { formatDate } from '@/features/leases/dates'
import { errorMessage } from '@/lib/error-messages'
import { useDownloadFiling, useFilingPreview, useResidenceForm } from '@/features/visitors/hooks'
import type { Visitor } from '@/features/visitors/types'

/** Hands the browser a file without navigating this screen away. */
function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/**
 * Producing the temporary-residence form for registrations on this tenancy.
 *
 * ── Why several people can be chosen ────────────────────────────────────────
 *
 * The form has a table for "members of the household changing with" the
 * declarant, so a family that arrived together is ONE filing rather than three.
 * The first person ticked is the declarant; the rest go in that table.
 *
 * ── Why the empty boxes are named here and not after the download ───────────
 *
 * An owner who learns at the printer that the signatory's identity number is
 * missing has wasted the trip. This asks the API what it could not fill while
 * the owner is still at a keyboard.
 */
export function ResidenceFilingDialog({
  open,
  leaseId,
  visitors,
  onClose,
  onRecordSignatoryNumber,
}: {
  open: boolean
  leaseId: number
  /** Only the registrations worth filing for — see the card. */
  visitors: Visitor[]
  onClose: () => void
  /** Offered when the one fixable missing box is the signatory's number. */
  onRecordSignatoryNumber: (() => void) | null
}) {
  const form = useResidenceForm()
  const [chosen, setChosen] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const preview = useFilingPreview(leaseId, chosen)
  const download = useDownloadFiling(leaseId)

  useEffect(() => {
    if (!open) return
    // Nothing pre-ticked: who goes on one form is a decision, and guessing it
    // would have the owner un-ticking somebody rather than ticking them.
    setChosen([])
    setError(null)
  }, [open])

  function toggle(id: number) {
    setChosen((current) =>
      current.includes(id) ? current.filter((one) => one !== id) : [...current, id],
    )
  }

  const noBlankForm = form.data?.exists === false
  const emptyBoxes = preview.data?.emptyBoxes ?? []
  const signatoryMissing = preview.data?.signatory?.hasIdCardNumber === false
  const busy = download.isPending

  async function run() {
    setError(null)
    try {
      const { blob, fileName } = await download.mutateAsync(chosen)
      saveBlob(blob, fileName)
      onClose()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Tờ khai cư trú CT01</DialogTitle>
      <DialogContent>
        <DialogContentText variant="body2" sx={{ mb: 2 }}>
          Chọn những người đi cùng nhau — <strong>người đầu tiên</strong> là người kê
          khai, những người còn lại vào bảng “thành viên cùng thay đổi”. Tải về rồi in,
          ký, nộp cho công an phường.
        </DialogContentText>

        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}

          {noBlankForm && (
            <Alert severity="warning">
              <AlertTitle>Chưa có mẫu tờ khai</AlertTitle>
              Cần tải mẫu CT01 lên một lần ở trang Hợp đồng trước khi điền được.
            </Alert>
          )}

          {visitors.length === 0 ? (
            <Alert severity="info">
              Chưa có đăng ký nào để khai. Khai khách đến ở trước đã.
            </Alert>
          ) : (
            <Box>
              {visitors.map((visitor, index) => {
                const order = chosen.indexOf(visitor.id)
                return (
                  <FormControlLabel
                    key={visitor.id}
                    control={
                      <Checkbox
                        checked={order !== -1}
                        onChange={() => toggle(visitor.id)}
                        disabled={busy}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2">
                          {visitor.fullName}
                          {order === 0 && (
                            <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>
                              {' '}
                              · người kê khai
                            </Box>
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {visitor.idCardNumber} · {formatDate(visitor.arrivesOn)} →{' '}
                          {formatDate(visitor.expectedUntil)}
                        </Typography>
                      </Box>
                    }
                    sx={{ display: 'flex', mb: index === visitors.length - 1 ? 0 : 1 }}
                  />
                )
              })}
            </Box>
          )}

          {preview.error && <Alert severity="error">{errorMessage(preview.error)}</Alert>}

          {chosen.length > 0 && preview.isPending && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
              <CircularProgress size={22} />
            </Box>
          )}

          {preview.data && (
            <>
              <Divider />
              {emptyBoxes.length === 0 ? (
                <Alert severity="success">
                  Điền được hết các mục. Chỉ còn phần chữ ký là viết tay.
                </Alert>
              ) : (
                <Alert severity="warning">
                  <AlertTitle sx={{ mb: 0.5 }}>
                    {emptyBoxes.length} mục sẽ để trống, điền tay khi in ra
                  </AlertTitle>
                  <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                    {emptyBoxes.map((box) => (
                      <li key={box}>
                        <Typography variant="body2">{box}</Typography>
                      </li>
                    ))}
                  </Box>
                  {signatoryMissing && onRecordSignatoryNumber !== null && (
                    <Button
                      size="small"
                      sx={{ mt: 1 }}
                      onClick={onRecordSignatoryNumber}
                      disabled={busy}
                    >
                      Nhập số định danh của {preview.data.signatory?.fullName}
                    </Button>
                  )}
                </Alert>
              )}
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={busy}>
          Quay lại
        </Button>
        <Button
          variant="contained"
          startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <DescriptionIcon />}
          disabled={chosen.length === 0 || busy || noBlankForm}
          onClick={() => void run()}
        >
          {busy ? 'Đang tạo…' : 'Tải tờ khai'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
