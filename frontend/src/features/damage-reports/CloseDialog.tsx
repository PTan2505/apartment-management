import { useEffect, useState } from 'react'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { errorMessage } from '@/lib/error-messages'
import { useCloseReport } from '@/features/damage-reports/hooks'
import type { DamageReport } from '@/features/damage-reports/types'

/**
 * Closing a report, with a note of what was done.
 *
 * Closable from either state, because some things are fixed on the spot and
 * inventing an appointment to record that would be writing down something that
 * did not happen. It cannot be undone: what breaks again is a new report, and
 * two rows say "this happened twice" where one edited row says nothing.
 */
export function CloseDialog({
  report,
  onClose,
}: {
  report: DamageReport | null
  onClose: () => void
}) {
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const close = useCloseReport()

  useEffect(() => {
    setNote('')
    setError(null)
  }, [report])

  async function submit() {
    if (!report || note.trim() === '') return
    setError(null)
    try {
      await close.mutateAsync({ id: report.id, note: note.trim() })
      onClose()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  return (
    <ConfirmDialog
      open={report !== null}
      title="Đóng báo hỏng này?"
      description={`Phòng ${report?.room.roomCode ?? ''}: ghi nhận đã xử lí xong. Không mở lại được — hỏng lại thì khách gửi báo hỏng mới.`}
      confirmLabel="Đóng báo hỏng"
      busyLabel="Đang đóng…"
      destructive
      busy={close.isPending}
      error={error}
      onConfirm={() => void submit()}
      onClose={onClose}
    >
      <Stack spacing={1}>
        <TextField
          label="Đã xử lí thế nào"
          fullWidth
          multiline
          minRows={2}
          autoFocus
          value={note}
          onChange={(event) => setNote(event.target.value)}
          helperText="Ví dụ: đã thay gioăng vòi, hết rò."
        />
      </Stack>
    </ConfirmDialog>
  )
}
