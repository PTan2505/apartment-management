import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import BuildIcon from '@mui/icons-material/Build'

import {
  PortalLinkInvalid,
  raiseReport,
  signReportPhoto,
  confirmReportPhoto,
  type PortalReport,
} from '@/features/portal/api'

/** A date and time as a tenant reads one. */
function when(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * What became of a report, said to the person who raised it.
 *
 * In THEIR terms, not the staff's: "new" is a word for the people triaging,
 * while a tenant needs to know whether somebody is coming and when.
 */
function stateLine(report: PortalReport): { label: string; detail: string; color: 'warning' | 'info' | 'success' } {
  if (report.state === 'done') {
    return {
      label: 'Đã xong',
      detail: report.closingNote
        ? `${report.closingNote}${report.closedAt ? ` · ${when(report.closedAt)}` : ''}`
        : `Đã xử lí xong${report.closedAt ? ` ngày ${when(report.closedAt)}` : ''}`,
      color: 'success',
    }
  }
  if (report.state === 'scheduled') {
    return {
      label: 'Đã hẹn lịch',
      detail: `Hẹn ${when(report.scheduledFor)}${report.scheduleNote ? ` · ${report.scheduleNote}` : ''}`,
      color: 'info',
    }
  }
  return {
    label: 'Đã nhận',
    detail: 'Chủ nhà đã nhận được, chưa hẹn lịch. Sẽ liên hệ với bạn.',
    color: 'warning',
  }
}

const MAX_PHOTO_BYTES = 10 * 1024 * 1024

/**
 * Reporting something broken, and following what became of it.
 *
 * On the same page as the bills, not behind a link: the portal is one page a
 * tenant scrolls on a phone, and one page with two sections is easier to hold
 * than two pages with one each.
 *
 * The form asks for nothing the link already answers — not the room, not who
 * they are. Photographs are optional: somebody reporting a leak from a dark
 * stairwell is the case this exists for, and a required attachment is a reason
 * not to report at all.
 */
export function ReportsSection({
  reports,
  onChanged,
  onLinkInvalid,
}: {
  reports: PortalReport[]
  onChanged: () => void | Promise<void>
  onLinkInvalid: () => void
}) {
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function send() {
    if (description.trim() === '') return
    setBusy(true)
    setError(null)
    try {
      const report = await raiseReport(description.trim())

      // Photographs, one at a time, through the same three steps the contracts
      // use: ask for a place, PUT the bytes there, tell the API they arrived.
      for (const file of files) {
        if (file.size > MAX_PHOTO_BYTES) {
          throw new Error('Ảnh quá lớn, tối đa 10 MB mỗi ảnh.')
        }
        const signed = await signReportPhoto(report.id, file.type)
        const put = await fetch(signed.url, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        })
        if (!put.ok) throw new Error('Tải ảnh lên không thành công. Thử lại nhé.')
        await confirmReportPhoto(report.id, signed.key)
      }

      setDescription('')
      setFiles([])
      setOpen(false)
      setSent(true)
      await onChanged()
    } catch (cause) {
      if (cause instanceof PortalLinkInvalid) {
        onLinkInvalid()
        return
      }
      setError(cause instanceof Error ? cause.message : 'Không gửi được. Thử lại nhé.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box>
      <Typography variant="overline" color="text.secondary">
        Báo hỏng
      </Typography>

      {sent && (
        <Alert severity="success" sx={{ mb: 1 }} onClose={() => setSent(false)}>
          Đã gửi. Chủ nhà sẽ liên hệ với bạn để hẹn lịch.
        </Alert>
      )}

      {!open && (
        <Button
          variant="outlined"
          fullWidth
          startIcon={<BuildIcon />}
          onClick={() => setOpen(true)}
          sx={{ mb: 1.5 }}
        >
          Báo hỏng trong phòng
        </Button>
      )}

      {open && (
        <Card variant="outlined" sx={{ mb: 1.5 }}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Tả giúp chỗ hỏng bằng lời của bạn. Không cần ghi phòng — link này đã biết
                bạn ở phòng nào.
              </Typography>

              {error && <Alert severity="error">{error}</Alert>}

              <TextField
                label="Hỏng cái gì"
                multiline
                minRows={3}
                fullWidth
                autoFocus
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Ví dụ: vòi nước nhà tắm rò, chảy suốt đêm"
              />

              <Button variant="text" component="label" sx={{ alignSelf: 'flex-start' }}>
                {files.length > 0 ? `Đã chọn ${files.length} ảnh` : 'Thêm ảnh (không bắt buộc)'}
                <input
                  hidden
                  type="file"
                  accept="image/jpeg,image/png,image/heic"
                  multiple
                  onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
                />
              </Button>

              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  onClick={() => void send()}
                  disabled={busy || description.trim() === ''}
                  startIcon={busy ? <CircularProgress size={18} color="inherit" /> : undefined}
                >
                  {busy ? 'Đang gửi…' : 'Gửi báo hỏng'}
                </Button>
                <Button onClick={() => setOpen(false)} disabled={busy}>
                  Thôi
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {reports.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Bạn chưa báo hỏng gì. Có gì hỏng trong phòng thì báo ở đây.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {reports.map((report) => {
            const line = stateLine(report)
            return (
              <Card key={report.id} variant="outlined">
                <CardContent sx={{ py: 1.5 }}>
                  <Stack spacing={0.75}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {report.description}
                      </Typography>
                      <Chip size="small" color={line.color} variant="outlined" label={line.label} />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {line.detail}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Báo lúc {when(report.reportedAt)}
                      {report.photos.length > 0 ? ` · ${report.photos.length} ảnh` : ''}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            )
          })}
        </Stack>
      )}
    </Box>
  )
}
