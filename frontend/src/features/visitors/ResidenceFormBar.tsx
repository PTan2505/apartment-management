import { useRef, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import DeleteIcon from '@mui/icons-material/Delete'
import AssignmentIcon from '@mui/icons-material/Assignment'
import DownloadIcon from '@mui/icons-material/Download'
import UploadFileIcon from '@mui/icons-material/UploadFile'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { isApiError } from '@/lib/api-error'
import { errorMessage } from '@/lib/error-messages'
import { formatDate } from '@/features/leases/dates'
import { useIsOwner } from '@/features/auth/useAuth'
import * as visitorsApi from '@/features/visitors/api'
import { RESIDENCE_FORM_TYPE } from '@/features/visitors/api'
import {
  useRemoveResidenceForm,
  useResidenceForm,
  useUploadResidenceForm,
} from '@/features/visitors/hooks'

/** KB under a megabyte: a 60 KB file shown as "0.1 MB" reads as an empty one. */
function coTep(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function loi(cause: unknown, duPhong = 'Không thực hiện được. Thử lại sau.'): string {
  if (isApiError(cause)) return errorMessage(cause)
  return cause instanceof Error ? cause.message : duPhong
}

/**
 * The blank CT01 every filled form is produced from.
 *
 * ── Why the owner uploads it instead of it shipping with the code ───────────
 *
 * The authorities reissue this form when the regulation changes — the current
 * one dates from Thông tư 56/2021/TT-BCA. An owner who can replace the file
 * themselves is not waiting on a deployment.
 *
 * ── Why only .docx, and why that is said out loud ──────────────────────────
 *
 * The file is opened and written into, not merely stored and handed back, and
 * only one format can be. CT01 is published as the older binary .doc, so the
 * owner WILL arrive with one — which is why the helper text names the fix
 * rather than just refusing the file.
 */
export function ResidenceFormBar() {
  const query = useResidenceForm()
  const upload = useUploadResidenceForm()
  const remove = useRemoveResidenceForm()
  const isOwner = useIsOwner()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<'uploading' | 'downloading' | 'removing' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [asked, setAsked] = useState<{ kind: 'remove' } | { kind: 'replace'; file: File } | null>(
    null,
  )
  const [askError, setAskError] = useState<string | null>(null)

  async function send(file: File): Promise<boolean> {
    setError(null)
    setAskError(null)
    setBusy('uploading')
    try {
      await upload.mutateAsync(file)
      return true
    } catch (cause) {
      const noi = loi(cause, 'Không tải lên được tệp này.')
      if (asked) setAskError(noi)
      else setError(noi)
      return false
    } finally {
      setBusy(null)
      if (input.current) input.current.value = ''
    }
  }

  async function download(fileName: string) {
    setError(null)
    setBusy('downloading')
    try {
      const { url } = await visitorsApi.residenceFormDownloadUrl()
      const blob = await visitorsApi.fetchResidenceFormFile(url)
      // An anchor over a blob URL is same-origin, so `download` is honoured and
      // this screen is not navigated away.
      const saveAs = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = saveAs
      link.download = fileName
      link.click()
      setTimeout(() => URL.revokeObjectURL(saveAs), 60_000)
    } catch (cause) {
      setError(loi(cause))
    } finally {
      setBusy(null)
    }
  }

  async function doRemove() {
    setError(null)
    setAskError(null)
    setBusy('removing')
    try {
      await remove.mutateAsync()
      setAsked(null)
    } catch (cause) {
      setAskError(loi(cause))
    } finally {
      setBusy(null)
    }
  }

  const form = query.data

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
          <AssignmentIcon color="action" />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Mẫu tờ khai cư trú CT01
            </Typography>
            {query.isPending ? (
              <Typography variant="body2" color="text.secondary">
                Đang tải…
              </Typography>
            ) : form?.exists ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ overflowWrap: 'anywhere' }}
              >
                {form.fileName} · {coTep(form.size)} · tải lên {formatDate(form.uploadedAt)}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Chưa có mẫu. Tải lên một bản <strong>.docx</strong> có đánh dấu chỗ điền để
                hệ thống khai hộ khách ghé.
              </Typography>
            )}
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {form?.exists && (
            <Button
              size="small"
              startIcon={<DownloadIcon />}
              disabled={busy !== null}
              onClick={() => void download(form.fileName)}
            >
              {busy === 'downloading' ? 'Đang tải…' : 'Tải xuống'}
            </Button>
          )}
          {/*
            Replacing the blank form is the business changing the paper it puts
            in front of the authorities, so it stays with the owner. Hidden
            rather than shown-and-refused: a button that always answers 403 is
            a button that teaches nothing.
          */}
          {isOwner && (
            <Button
              size="small"
              startIcon={<UploadFileIcon />}
              disabled={busy !== null}
              onClick={() => input.current?.click()}
            >
              {busy === 'uploading' ? 'Đang tải lên…' : form?.exists ? 'Thay tệp' : 'Tải lên'}
            </Button>
          )}
          {isOwner && form?.exists && (
            <Button
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
              disabled={busy !== null}
              onClick={() => {
                setAskError(null)
                setAsked({ kind: 'remove' })
              }}
            >
              {busy === 'removing' ? 'Đang xoá…' : 'Xoá'}
            </Button>
          )}
          {query.isPending && <CircularProgress size={18} />}
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {error}
        </Alert>
      )}

      <input
        ref={input}
        type="file"
        accept={RESIDENCE_FORM_TYPE}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (!file) return
          // Replacing destroys the file in place, so it is confirmed like a
          // delete; a first upload has nothing to destroy.
          if (form?.exists) {
            setAskError(null)
            setAsked({ kind: 'replace', file })
          } else {
            void send(file)
          }
        }}
      />

      <ConfirmDialog
        open={asked !== null}
        title={asked?.kind === 'replace' ? 'Thay mẫu tờ khai?' : 'Xoá mẫu tờ khai?'}
        description={
          asked?.kind === 'replace'
            ? `Bản đang có sẽ bị thay bằng “${asked.file.name}”. Bản cũ không lấy lại được.`
            : 'Sau khi xoá, không điền được tờ khai nào cho tới khi tải mẫu mới lên.'
        }
        confirmLabel={asked?.kind === 'replace' ? 'Thay' : 'Xoá'}
        destructive
        busy={busy !== null}
        error={askError}
        onClose={() => {
          setAsked(null)
          setAskError(null)
        }}
        onConfirm={() => {
          if (asked?.kind === 'replace') void send(asked.file).then((ok) => ok && setAsked(null))
          else void doRemove()
        }}
      />
    </Paper>
  )
}
