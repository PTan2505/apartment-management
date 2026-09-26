import { useEffect, useState } from 'react'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { errorMessage } from '@/lib/error-messages'
import { useScheduleReport } from '@/features/damage-reports/hooks'
import type { DamageReport } from '@/features/damage-reports/types'

/** The datetime-local value for a given instant, or empty. */
function toLocalInput(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * The appointment agreed with the tenant, written down.
 *
 * Recorded AFTER the phone call, not instead of it: staff ring the number on
 * the report, agree a time, and this is where that time is kept so the tenant
 * can see it too.
 */
export function ScheduleDialog({
  report,
  onClose,
}: {
  report: DamageReport | null
  onClose: () => void
}) {
  const [when, setWhen] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const schedule = useScheduleReport()

  useEffect(() => {
    setWhen(toLocalInput(report?.scheduledFor ?? null))
    setNote(report?.scheduleNote ?? '')
    setError(null)
  }, [report])

  async function submit() {
    if (!report || when === '') return
    setError(null)
    try {
      await schedule.mutateAsync({
        id: report.id,
        // A local time typed by a person, sent as the instant it names.
        scheduledFor: new Date(when).toISOString(),
        note: note.trim() === '' ? undefined : note.trim(),
      })
      onClose()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  const moving = report?.state === 'scheduled'

  return (
    <ConfirmDialog
      open={report !== null}
      title={moving ? 'Đổi lịch hẹn?' : 'Ghi nhận lịch hẹn'}
      description={
        moving
          ? 'Lịch mới thay cho lịch cũ. Khách mở link portal sẽ thấy lịch mới.'
          : 'Ghi lại giờ đã hẹn với khách. Khách mở link portal sẽ thấy đúng giờ này.'
      }
      confirmLabel={moving ? 'Đổi lịch' : 'Lưu lịch hẹn'}
      busyLabel="Đang lưu…"
      busy={schedule.isPending}
      error={error}
      onConfirm={() => void submit()}
      onClose={onClose}
    >
      <Stack spacing={2}>
        <TextField
          label="Hẹn lúc"
          type="datetime-local"
          fullWidth
          value={when}
          onChange={(event) => setWhen(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Đã hẹn thế nào"
          fullWidth
          multiline
          minRows={2}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          helperText="Ví dụ: thợ tới 9h sáng thứ Bảy, khách ở nhà chờ."
        />
        <Typography variant="caption" color="text.secondary">
          Phòng {report?.room.roomCode} · {report?.building.displayName}
        </Typography>
      </Stack>
    </ConfirmDialog>
  )
}
