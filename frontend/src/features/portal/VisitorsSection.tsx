import { useEffect, useRef, useState } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'

import {
  PortalLinkInvalid,
  cancelVisitor,
  confirmVisitorIdCard,
  fetchVisitors,
  registerVisitor,
  signVisitorIdCard,
  type PortalVisitor,
  type PortalVisitorInput,
} from '@/features/portal/api'

/** A date as a tenant reads one. */
function day(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('vi-VN')
}

const STATE: Record<PortalVisitor['state'], { label: string; color: 'info' | 'primary' | 'default' }> = {
  upcoming: { label: 'Sắp đến', color: 'info' },
  staying: { label: 'Đang ở', color: 'primary' },
  finished: { label: 'Đã về', color: 'default' },
  cancelled: { label: 'Đã huỷ', color: 'default' },
}

interface Form {
  fullName: string
  idCardNumber: string
  dateOfBirth: string
  sex: 'male' | 'female'
  permanentAddress: string
  relationToSignatory: string
  phone: string
  email: string
  occupation: string
  arrivesOn: string
  expectedUntil: string
  note: string
}

const EMPTY: Form = {
  fullName: '',
  idCardNumber: '',
  dateOfBirth: '',
  sex: 'male',
  permanentAddress: '',
  relationToSignatory: '',
  phone: '',
  email: '',
  occupation: '',
  arrivesOn: '',
  expectedUntil: '',
  note: '',
}

const ID_CARD_PATTERN = /^\d{9}$|^\d{12}$/
const ID_CARD_ACCEPT = 'image/jpeg,image/png,image/heic'

/** Blank becomes ABSENT, not an empty string, for the optional boxes. */
function toInput(form: Form): PortalVisitorInput {
  const some = (value: string) => {
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
    phone: some(form.phone),
    email: some(form.email),
    occupation: some(form.occupation),
    arrivesOn: form.arrivesOn,
    expectedUntil: form.expectedUntil,
    note: some(form.note),
  }
}

/** One side of an identity document, added to a registration already filed. */
function IdCardButtons({
  visitor,
  onChanged,
  onInvalid,
}: {
  visitor: PortalVisitor
  onChanged: (updated: PortalVisitor) => void
  onInvalid: () => void
}) {
  const inputs = { front: useRef<HTMLInputElement>(null), back: useRef<HTMLInputElement>(null) }
  const [busy, setBusy] = useState<'front' | 'back' | null>(null)
  const [failed, setFailed] = useState<{ side: 'front' | 'back'; message: string } | null>(null)
  const label = { front: 'mặt trước', back: 'mặt sau' } as const
  const has = { front: visitor.hasIdCardFront, back: visitor.hasIdCardBack }

  async function send(side: 'front' | 'back', file: File | undefined) {
    if (!file) return
    setFailed(null)
    setBusy(side)
    try {
      const signed = await signVisitorIdCard(visitor.id, side, file.type)
      if (file.size > signed.maxBytes) {
        throw new Error(`Ảnh vượt quá ${Math.round(signed.maxBytes / 1024 / 1024)} MB`)
      }
      const response = await fetch(signed.url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!response.ok) throw new Error('Không tải được ảnh lên. Thử lại giúp nhé.')
      onChanged(await confirmVisitorIdCard(visitor.id, side, signed.key))
    } catch (cause) {
      if (cause instanceof PortalLinkInvalid) {
        onInvalid()
        return
      }
      // Named per side: two pickers and one message would have the tenant redo
      // the picture that worked.
      setFailed({
        side,
        message: cause instanceof Error ? cause.message : 'Không tải được ảnh lên.',
      })
    } finally {
      setBusy(null)
    }
  }

  return (
    <Box sx={{ mt: 1 }}>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
        {(['front', 'back'] as const).map((side) => (
          <Box key={side}>
            <input
              ref={inputs[side]}
              type="file"
              accept={ID_CARD_ACCEPT}
              hidden
              onChange={(event) => {
                void send(side, event.target.files?.[0])
                event.target.value = ''
              }}
            />
            <Button
              size="small"
              variant={has[side] ? 'outlined' : 'text'}
              startIcon={
                busy === side ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <PhotoCameraIcon fontSize="small" />
                )
              }
              disabled={busy !== null}
              onClick={() => inputs[side].current?.click()}
            >
              {has[side] ? `Đã có ${label[side]}` : `Thêm ảnh ${label[side]}`}
            </Button>
          </Box>
        ))}
      </Stack>
      {failed !== null && (
        <Alert severity="error" sx={{ mt: 1 }}>
          Ảnh {label[failed.side]}: {failed.message}
        </Alert>
      )}
    </Box>
  )
}

/**
 * Where a tenant declares somebody staying with them.
 *
 * ── Why it asks for so much ─────────────────────────────────────────────────
 *
 * Every required box is a box on the form the landlord has to file with the
 * police. The section says so in one line, because a form demanding a cousin's
 * date of birth with no explanation reads as nosiness and gets ignored.
 *
 * ── What it never mentions ──────────────────────────────────────────────────
 *
 * The occupant count, and any charge. Nothing here changes either, and
 * mentioning money on a form about hospitality would make a tenant think
 * declaring a guest costs them something.
 */
export function VisitorsSection({ onLinkInvalid }: { onLinkInvalid: () => void }) {
  const [visitors, setVisitors] = useState<PortalVisitor[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [sending, setSending] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function load() {
    try {
      setVisitors(await fetchVisitors())
      setLoadError(null)
    } catch (cause) {
      if (cause instanceof PortalLinkInvalid) {
        onLinkInvalid()
        return
      }
      setLoadError(cause instanceof Error ? cause.message : 'Không tải được danh sách.')
    }
  }

  useEffect(() => {
    void load()
    // Loaded once when the section appears; every change below writes the
    // answer back rather than asking again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
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

  async function submit() {
    setSending(true)
    setFormError(null)
    try {
      const made = await registerVisitor(toInput(form))
      setVisitors((current) => [made, ...(current ?? [])])
      setForm(EMPTY)
      setOpen(false)
    } catch (cause) {
      if (cause instanceof PortalLinkInvalid) {
        onLinkInvalid()
        return
      }
      setFormError(cause instanceof Error ? cause.message : 'Không gửi được.')
    } finally {
      setSending(false)
    }
  }

  async function drop(visitor: PortalVisitor) {
    try {
      const updated = await cancelVisitor(visitor.id)
      setVisitors((current) =>
        (current ?? []).map((one) => (one.id === updated.id ? updated : one)),
      )
    } catch (cause) {
      if (cause instanceof PortalLinkInvalid) {
        onLinkInvalid()
        return
      }
      setLoadError(cause instanceof Error ? cause.message : 'Không huỷ được.')
    }
  }

  function replace(updated: PortalVisitor) {
    setVisitors((current) => (current ?? []).map((one) => (one.id === updated.id ? updated : one)))
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1.5}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Người thân đến ở
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Khai trước khi khách đến, để chủ nhà làm giấy tạm trú.
              </Typography>
            </Box>
            {!open && (
              <Button
                variant="contained"
                size="small"
                startIcon={<GroupAddIcon />}
                onClick={() => {
                  setFormError(null)
                  setOpen(true)
                }}
              >
                Khai người đến ở
              </Button>
            )}
          </Box>

          {loadError && <Alert severity="error">{loadError}</Alert>}

          {open && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Những mục có dấu <strong>*</strong> là các mục trên tờ khai tạm trú mà chủ
                nhà phải nộp cho công an — khai đủ ở đây thì không ai phải gọi lại hỏi thêm.
              </Alert>

              <Stack spacing={2}>
                {formError && <Alert severity="error">{formError}</Alert>}

                <TextField
                  label="Họ và tên"
                  required
                  fullWidth
                  size="small"
                  value={form.fullName}
                  onChange={(event) => set('fullName', event.target.value)}
                />
                <TextField
                  label="Số định danh cá nhân / CMND"
                  required
                  fullWidth
                  size="small"
                  value={form.idCardNumber}
                  onChange={(event) => set('idCardNumber', event.target.value)}
                  error={idCardBad}
                  helperText={idCardBad ? 'Phải là 9 hoặc 12 chữ số.' : '12 số với CCCD.'}
                />
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    label="Ngày sinh"
                    type="date"
                    required
                    size="small"
                    value={form.dateOfBirth}
                    onChange={(event) => set('dateOfBirth', event.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ flex: '1 1 150px' }}
                  />
                  <TextField
                    select
                    label="Giới tính"
                    required
                    size="small"
                    value={form.sex}
                    onChange={(event) => set('sex', event.target.value as 'male' | 'female')}
                    sx={{ flex: '1 1 120px' }}
                  >
                    <MenuItem value="male">Nam</MenuItem>
                    <MenuItem value="female">Nữ</MenuItem>
                  </TextField>
                </Box>
                <TextField
                  label="Nơi thường trú"
                  required
                  fullWidth
                  size="small"
                  value={form.permanentAddress}
                  onChange={(event) => set('permanentAddress', event.target.value)}
                  helperText="Địa chỉ trên hộ khẩu, không phải phòng đang thuê."
                />
                <TextField
                  label="Quan hệ với bạn"
                  required
                  fullWidth
                  size="small"
                  value={form.relationToSignatory}
                  onChange={(event) => set('relationToSignatory', event.target.value)}
                  helperText="Ví dụ: em ruột, bạn, mẹ."
                />
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    label="Ngày đến"
                    type="date"
                    required
                    size="small"
                    value={form.arrivesOn}
                    onChange={(event) => set('arrivesOn', event.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ flex: '1 1 150px' }}
                  />
                  <TextField
                    label="Ngày dự kiến đi"
                    type="date"
                    required
                    size="small"
                    value={form.expectedUntil}
                    onChange={(event) => set('expectedUntil', event.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    error={datesBackwards}
                    helperText={
                      datesBackwards
                        ? 'Ngày đi phải sau ngày đến.'
                        : 'Chưa biết chắc thì ghi tạm, ở lâu hơn thì sửa sau.'
                    }
                    sx={{ flex: '1 1 150px' }}
                  />
                </Box>

                <Divider />
                <Typography variant="caption" color="text.secondary">
                  Ba mục dưới <strong>không bắt buộc</strong> — để trống vẫn gửi được.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    label="Số điện thoại"
                    size="small"
                    value={form.phone}
                    onChange={(event) => set('phone', event.target.value)}
                    sx={{ flex: '1 1 150px' }}
                  />
                  <TextField
                    label="Email"
                    size="small"
                    value={form.email}
                    onChange={(event) => set('email', event.target.value)}
                    sx={{ flex: '1 1 180px' }}
                  />
                </Box>
                <TextField
                  label="Nghề nghiệp, nơi làm việc"
                  size="small"
                  fullWidth
                  value={form.occupation}
                  onChange={(event) => set('occupation', event.target.value)}
                />

                <Typography variant="caption" color="text.secondary">
                  Ảnh CCCD thêm được sau khi gửi — chưa có sẵn thì cứ gửi trước.
                </Typography>

                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    disabled={!ready || sending}
                    startIcon={sending ? <CircularProgress size={16} color="inherit" /> : undefined}
                    onClick={() => void submit()}
                  >
                    {sending ? 'Đang gửi…' : 'Gửi'}
                  </Button>
                  <Button disabled={sending} onClick={() => setOpen(false)}>
                    Thôi
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}

          {visitors === null ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={22} />
            </Box>
          ) : visitors.length === 0 ? (
            !open && (
              <Typography variant="body2" color="text.secondary">
                Bạn chưa khai ai. Có người thân đến ở thì khai trước giúp nhé.
              </Typography>
            )
          ) : (
            <Stack divider={<Divider />} spacing={1.5}>
              {visitors.map((visitor) => {
                const closed = visitor.state === 'finished' || visitor.state === 'cancelled'
                return (
                  <Box key={visitor.id} sx={{ opacity: closed ? 0.65 : 1 }}>
                    <Box
                      sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}
                    >
                      <Typography sx={{ fontWeight: 600 }}>{visitor.fullName}</Typography>
                      <Chip
                        size="small"
                        color={STATE[visitor.state].color}
                        variant={closed ? 'outlined' : 'filled'}
                        label={STATE[visitor.state].label}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {day(visitor.arrivesOn)} → {day(visitor.expectedUntil)} ·{' '}
                      {visitor.relationToSignatory}
                    </Typography>
                    {visitor.addedByStaff && (
                      <Typography variant="caption" color="text.secondary">
                        Do nhà trọ khai hộ.
                      </Typography>
                    )}

                    {/*
                      Said to the tenant WITHOUT mentioning money, because
                      nothing here changes a charge. What they need to know is
                      that the landlord has paperwork to do.
                    */}
                    {visitor.needsAttention && (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        <AlertTitle sx={{ mb: 0 }}>
                          Đã ở {visitor.stayDays} ngày
                        </AlertTitle>
                        Ở quá {visitor.overlongAfterDays} ngày thì nên nói với chủ nhà, để
                        giấy tờ tạm trú làm cho đúng.
                      </Alert>
                    )}

                    {!closed && (
                      <>
                        <IdCardButtons
                          visitor={visitor}
                          onChanged={replace}
                          onInvalid={onLinkInvalid}
                        />
                        <Button size="small" color="warning" onClick={() => void drop(visitor)}>
                          Huỷ khai
                        </Button>
                      </>
                    )}
                  </Box>
                )
              })}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
