import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { SEXES, sexLabel } from '@/features/visitors/labels'
import type { Sex, Visitor, VisitorInput } from '@/features/visitors/types'

const EMPTY = {
  fullName: '',
  idCardNumber: '',
  dateOfBirth: '',
  sex: 'male' as Sex,
  permanentAddress: '',
  relationToSignatory: '',
  phone: '',
  email: '',
  occupation: '',
  arrivesOn: '',
  expectedUntil: '',
  note: '',
}

type Form = typeof EMPTY

function fromVisitor(visitor: Visitor): Form {
  return {
    fullName: visitor.fullName,
    idCardNumber: visitor.idCardNumber,
    dateOfBirth: visitor.dateOfBirth.slice(0, 10),
    sex: visitor.sex,
    permanentAddress: visitor.permanentAddress,
    relationToSignatory: visitor.relationToSignatory,
    phone: visitor.phone ?? '',
    email: visitor.email ?? '',
    occupation: visitor.occupation ?? '',
    arrivesOn: visitor.arrivesOn.slice(0, 10),
    expectedUntil: visitor.expectedUntil.slice(0, 10),
    note: visitor.note ?? '',
  }
}

/** Blank becomes ABSENT rather than an empty string, for the three optional boxes. */
function toInput(form: Form): VisitorInput {
  const trimmed = (value: string) => {
    const text = value.trim()
    return text === '' ? undefined : text
  }
  return {
    fullName: form.fullName.trim(),
    idCardNumber: form.idCardNumber.trim(),
    dateOfBirth: form.dateOfBirth,
    sex: form.sex,
    permanentAddress: form.permanentAddress.trim(),
    relationToSignatory: form.relationToSignatory.trim(),
    phone: trimmed(form.phone),
    email: trimmed(form.email),
    occupation: trimmed(form.occupation),
    arrivesOn: form.arrivesOn,
    expectedUntil: form.expectedUntil,
    note: trimmed(form.note),
  }
}

const ID_CARD_PATTERN = /^\d{9}$|^\d{12}$/

/**
 * Registering somebody who is staying, or correcting a registration.
 *
 * ── Why the form is this long ───────────────────────────────────────────────
 *
 * Every required box here is a box on the residence form the landlord has to
 * file. A shorter form would be kinder to fill in and would produce paperwork
 * that cannot be submitted — discovered weeks later, by the owner, at the
 * police station. So the page says what the boxes are FOR, and the three the
 * form itself tolerates empty are marked optional and grouped apart.
 *
 * Used by both the staff screen and the tenant's portal. The wording is
 * written for the tenant, who is the one most likely to be reading it on a
 * phone in a corridor.
 */
export function VisitorFormDialog({
  open,
  visitor,
  signatoryName,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean
  /** Null to register somebody new. */
  visitor: Visitor | null
  /** Who box 12's relationship is measured against. */
  signatoryName: string | null
  busy: boolean
  error: string | null
  onClose: () => void
  onSubmit: (input: VisitorInput) => void
}) {
  const [form, setForm] = useState<Form>(EMPTY)

  useEffect(() => {
    if (!open) return
    setForm(visitor === null ? EMPTY : fromVisitor(visitor))
  }, [open, visitor])

  const set = <K extends keyof Form>(key: K) => (value: Form[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const idCardBad = form.idCardNumber !== '' && !ID_CARD_PATTERN.test(form.idCardNumber.trim())
  const datesBackwards =
    form.arrivesOn !== '' && form.expectedUntil !== '' && form.expectedUntil < form.arrivesOn

  const ready =
    form.fullName.trim() !== '' &&
    ID_CARD_PATTERN.test(form.idCardNumber.trim()) &&
    form.dateOfBirth !== '' &&
    form.permanentAddress.trim() !== '' &&
    form.relationToSignatory.trim() !== '' &&
    form.arrivesOn !== '' &&
    form.expectedUntil !== '' &&
    !datesBackwards

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{visitor === null ? 'Khai khách đến ở' : 'Sửa đăng ký khách'}</DialogTitle>
      <DialogContent>
        <DialogContentText variant="body2" sx={{ mb: 2 }}>
          Những mục có dấu <strong>*</strong> là các mục trên{' '}
          <strong>tờ khai cư trú (CT01)</strong> mà chủ nhà phải nộp. Khai đủ ở đây thì
          không ai phải gọi lại hỏi thêm.
        </DialogContentText>

        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Họ và tên"
            required
            fullWidth
            autoFocus
            value={form.fullName}
            onChange={(event) => set('fullName')(event.target.value)}
          />

          <TextField
            label="Số định danh cá nhân / CMND"
            required
            fullWidth
            value={form.idCardNumber}
            onChange={(event) => set('idCardNumber')(event.target.value)}
            error={idCardBad}
            helperText={
              idCardBad
                ? 'Số định danh phải là 9 hoặc 12 chữ số.'
                : '12 số với CCCD, 9 số với CMND cũ.'
            }
          />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Ngày sinh"
              type="date"
              required
              value={form.dateOfBirth}
              onChange={(event) => set('dateOfBirth')(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: '1 1 160px' }}
            />
            <TextField
              select
              label="Giới tính"
              required
              value={form.sex}
              onChange={(event) => set('sex')(event.target.value as Sex)}
              sx={{ flex: '1 1 140px' }}
            >
              {SEXES.map((sex) => (
                <MenuItem key={sex} value={sex}>
                  {sexLabel(sex)}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <TextField
            label="Nơi thường trú"
            required
            fullWidth
            value={form.permanentAddress}
            onChange={(event) => set('permanentAddress')(event.target.value)}
            helperText="Địa chỉ trên hộ khẩu / nơi ở thường xuyên, không phải phòng đang thuê."
          />

          <TextField
            label={
              signatoryName === null
                ? 'Quan hệ với người đứng tên hợp đồng'
                : `Quan hệ với ${signatoryName}`
            }
            required
            fullWidth
            value={form.relationToSignatory}
            onChange={(event) => set('relationToSignatory')(event.target.value)}
            helperText="Ví dụ: em ruột, bạn, mẹ."
          />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Ngày đến"
              type="date"
              required
              value={form.arrivesOn}
              onChange={(event) => set('arrivesOn')(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: '1 1 160px' }}
            />
            <TextField
              label="Ngày dự kiến đi"
              type="date"
              required
              value={form.expectedUntil}
              onChange={(event) => set('expectedUntil')(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              error={datesBackwards}
              helperText={
                datesBackwards
                  ? 'Ngày đi phải sau ngày đến.'
                  : 'Chưa biết chắc thì cứ ghi tạm — ở lâu hơn thì sửa lại sau.'
              }
              sx={{ flex: '1 1 160px' }}
            />
          </Box>

          <Divider />
          <Typography variant="body2" color="text.secondary">
            Ba mục dưới đây <strong>không bắt buộc</strong> — tờ khai vẫn nộp được khi để
            trống, và chủ nhà có thể viết tay sau.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Số điện thoại"
              value={form.phone}
              onChange={(event) => set('phone')(event.target.value)}
              sx={{ flex: '1 1 160px' }}
            />
            <TextField
              label="Email"
              value={form.email}
              onChange={(event) => set('email')(event.target.value)}
              sx={{ flex: '1 1 200px' }}
            />
          </Box>

          <TextField
            label="Nghề nghiệp, nơi làm việc"
            fullWidth
            value={form.occupation}
            onChange={(event) => set('occupation')(event.target.value)}
          />

          <TextField
            label="Ghi chú"
            fullWidth
            multiline
            minRows={2}
            value={form.note}
            onChange={(event) => set('note')(event.target.value)}
            helperText="Chỉ để chủ nhà và bạn đọc, không lên tờ khai."
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={busy}>
          Quay lại
        </Button>
        <Button
          variant="contained"
          disabled={!ready || busy}
          startIcon={busy ? <CircularProgress size={18} color="inherit" /> : undefined}
          onClick={() => onSubmit(toInput(form))}
        >
          {busy ? 'Đang lưu…' : visitor === null ? 'Khai' : 'Lưu'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
