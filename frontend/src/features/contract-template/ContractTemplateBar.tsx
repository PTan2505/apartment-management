import { useRef, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import DeleteIcon from '@mui/icons-material/Delete'
import DescriptionIcon from '@mui/icons-material/Description'
import DownloadIcon from '@mui/icons-material/Download'
import UploadFileIcon from '@mui/icons-material/UploadFile'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { isApiError } from '@/lib/api-error'
import { errorMessage } from '@/lib/error-messages'
import { formatDate } from '@/features/leases/dates'
import * as templateApi from '@/features/contract-template/api'
import { TEMPLATE_ACCEPT } from '@/features/contract-template/api'
import {
  useContractTemplate,
  useSetContractTemplate,
} from '@/features/contract-template/hooks'

/** KB under a megabyte: a 60 KB file shown as "0.1 MB" reads as an empty one. */
function coTep(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/**
 * A failure in words: the API's own message when it answered, otherwise
 * whatever storage or the network said, and a plain sentence as a last resort.
 */
function loi(cause: unknown, duPhong = 'Không thực hiện được. Thử lại sau.'): string {
  if (isApiError(cause)) return errorMessage(cause)
  return cause instanceof Error ? cause.message : duPhong
}

/**
 * The blank contract the owner prints to sign with a new tenant.
 *
 * Above the list and deliberately quiet: it is consulted occasionally, while
 * the screen is about tenancies. There is exactly one of these in the system
 * and no database row behind it — storage is the record, which is why the file
 * name and the date come from the object itself.
 */
export function ContractTemplateBar() {
  const query = useContractTemplate()
  const remember = useSetContractTemplate()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<'uploading' | 'downloading' | 'removing' | null>(null)
  const [error, setError] = useState<string | null>(null)
  /**
   * What the owner asked for, held until they say they meant it. Replacing is
   * here beside removing: there is one template, so the file put in its place
   * deletes it.
   */
  const [asked, setAsked] = useState<{ kind: 'remove' } | { kind: 'replace'; file: File } | null>(
    null,
  )
  const [askError, setAskError] = useState<string | null>(null)

  async function upload(file: File): Promise<boolean> {
    setError(null)
    setAskError(null)
    setBusy('uploading')
    try {
      const signed = await templateApi.signTemplateUpload(file.name, file.type)
      // Checked before the upload as well as at confirmation: the upload is the
      // slow part, and refusing after it wastes the wait.
      if (file.size > signed.maxBytes) {
        throw new Error(`Tệp vượt quá ${Math.round(signed.maxBytes / 1024 / 1024)} MB`)
      }
      await templateApi.uploadToStorage(signed, file)
      remember(await templateApi.confirmTemplate(signed.key))
      return true
    } catch (cause) {
      const noi = loi(cause, 'Không tải lên được tệp này.')
      // Into whichever the owner is looking at.
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
      const { url } = await templateApi.getTemplateDownloadUrl()
      const blob = await templateApi.fetchTemplateFile(url)
      // Handed to the browser as a file to save. An anchor over a blob URL is
      // same-origin, so `download` is honoured and names the file — going to
      // the signed link instead would either open a tab or take this screen
      // away, and a pop-up blocker can swallow the tab without saying so.
      const saveAs = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = saveAs
      link.download = fileName
      link.click()
      // Released once the save has started; revoking in the same tick can
      // cancel it in some browsers.
      setTimeout(() => URL.revokeObjectURL(saveAs), 60_000)
    } catch (cause) {
      setError(loi(cause))
    } finally {
      setBusy(null)
    }
  }

  async function remove() {
    setError(null)
    setAskError(null)
    setBusy('removing')
    try {
      remember(await templateApi.removeTemplate())
      setAsked(null)
    } catch (cause) {
      setAskError(loi(cause))
    } finally {
      setBusy(null)
    }
  }

  const template = query.data

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
          <DescriptionIcon color="action" />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Hợp đồng mẫu
            </Typography>
            {query.isPending ? (
              <Typography variant="body2" color="text.secondary">
                Đang tải…
              </Typography>
            ) : template?.exists ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ overflowWrap: 'anywhere' }}
              >
                {template.fileName} · {coTep(template.size)} · tải lên{' '}
                {formatDate(template.uploadedAt)}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Chưa có tệp mẫu. Tải lên một bản để in khi ký hợp đồng.
              </Typography>
            )}
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {template?.exists && (
            <Button
              size="small"
              startIcon={<DownloadIcon />}
              disabled={busy !== null}
              onClick={() => void download(template.fileName)}
            >
              {busy === 'downloading' ? 'Đang tải…' : 'Tải xuống'}
            </Button>
          )}
          <Button
            size="small"
            startIcon={<UploadFileIcon />}
            disabled={busy !== null}
            onClick={() => input.current?.click()}
          >
            {busy === 'uploading' ? 'Đang tải lên…' : template?.exists ? 'Thay tệp' : 'Tải lên'}
          </Button>
          {template?.exists && (
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
        <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <ConfirmDialog
        open={asked !== null}
        title={asked?.kind === 'replace' ? 'Thay tệp mẫu?' : 'Xoá hợp đồng mẫu?'}
        description={
          asked?.kind === 'replace' ? (
            <>
              {template?.exists ? <strong>{template.fileName}</strong> : 'Tệp đang lưu'} sẽ bị xoá
              và thay bằng <strong>{asked.file.name}</strong>. Bản cũ không lấy lại được.
            </>
          ) : (
            <>
              {template?.exists ? <strong>{template.fileName}</strong> : 'Tệp mẫu'} sẽ bị xoá khỏi
              kho lưu trữ và không lấy lại được. Bạn vẫn có thể tải lên bản khác sau.
            </>
          )
        }
        confirmLabel={asked?.kind === 'replace' ? 'Thay tệp' : 'Xoá tệp'}
        busyLabel={asked?.kind === 'replace' ? 'Đang tải lên…' : 'Đang xoá…'}
        destructive
        busy={busy !== null}
        error={askError}
        onConfirm={() => {
          if (!asked) return
          if (asked.kind === 'replace') void upload(asked.file).then((ok) => { if (ok) setAsked(null) })
          else void remove()
        }}
        onClose={() => setAsked(null)}
      />

      <input
        ref={input}
        type="file"
        accept={TEMPLATE_ACCEPT}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (!file) return
          setAskError(null)
          // Asked only when there is a file to lose. The first upload destroys
          // nothing, and asking then would be a dialog about nothing.
          if (template?.exists) setAsked({ kind: 'replace', file })
          else void upload(file)
          event.target.value = ''
        }}
      />
    </Paper>
  )
}
