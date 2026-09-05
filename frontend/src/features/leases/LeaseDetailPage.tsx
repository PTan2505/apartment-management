import { useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import EditIcon from '@mui/icons-material/Edit'
import EventBusyIcon from '@mui/icons-material/EventBusy'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

import { isApiError } from '@/lib/api-error'
import { errorMessage } from '@/lib/error-messages'
import { formatMoney } from '@/lib/format'
import { EmptyState } from '@/components/EmptyState'
import { MOBILE_BREAKPOINT } from '@/app/theme'
import {
  formatCoveredThrough,
  formatDate,
  formatRemainingTerm,
  isTermRunOut,
} from '@/features/leases/dates'
import { useLease } from '@/features/leases/hooks'
import { CancelLeaseDialog } from '@/features/leases/CancelLeaseDialog'
import { ContractCard } from '@/features/leases/ContractCard'
import { EditTermsDialog } from '@/features/leases/EditTermsDialog'
import { LeaseInvoicesPanel } from '@/features/leases/LeaseInvoicesPanel'
import { OccupantsCard } from '@/features/leases/OccupantsCard'
import type { Lease } from '@/features/leases/types'

/** The three states a tenancy can be in, as an owner would name them. */
function statusLabel(status: Lease['status']): string {
  if (status === 'active') return 'Đang thuê'
  return status === 'cancelled' ? 'Đã huỷ' : 'Đã kết thúc'
}

/** A labelled fact. Enough of them that a component beats repeating the markup. */
function Field({
  label,
  value,
  hint,
  emphasis = false,
}: {
  label: string
  value: string
  hint?: string
  emphasis?: boolean
}) {
  return (
    <Box>
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      {/*
        The money reads first. A tenancy is argued about over its rent and its
        deposit, and at one weight for every field the reader has to FIND them
        rather than see them.
      */}
      <Typography variant={emphasis ? 'h6' : 'body1'} component="p">
        {value}
      </Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      )}
    </Box>
  )
}

/** One fact in the summary band: a quiet label, the value beside it. */
function BandFact({ label, value }: { label: string; value: string }) {
  return (
    <Typography variant="body2" color="text.secondary">
      {label}: <Box component="span" sx={{ color: 'text.primary', fontWeight: 500 }}>{value}</Box>
    </Typography>
  )
}

/**
 * What the tenancy is, and what is true of it now.
 *
 * Above the terms because those are the two questions this screen is opened to
 * answer — how long is left, and is it still running. Reaching them by reading
 * down a list of equal-weight rows is a summary the screen declined to give.
 */
function SummaryBand({ lease, onEdit }: { lease: Lease; onEdit: () => void }) {
  const remaining = formatRemainingTerm(lease)
  const tenantName =
    lease.tenant?.fullName ??
    (lease.status === 'active' ? 'Chưa ai đứng tên' : 'Không có người đứng tên')

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: { md: 'flex-start' } }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack
              direction="row"
              spacing={1.5}
              sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}
            >
              <Typography variant="h5" component="h2">
                {lease.room?.roomCode ?? `Phòng #${lease.roomId}`}
                {' • '}
                {/*
                  A running tenancy with nobody responsible is the case worth
                  flagging: the last occupant left before a move-out was
                  recorded, and nobody currently answers for it. On a finished
                  tenancy the same absence means the record simply never had a
                  name, which is not a warning.
                */}
                <Box
                  component="span"
                  sx={{
                    color:
                      !lease.tenant?.fullName && lease.status === 'active'
                        ? 'warning.main'
                        : 'inherit',
                  }}
                >
                  {tenantName}
                </Box>
              </Typography>
              {/*
                Cancelled reads as its own state rather than as "Ended". A
                tenancy that never happened is not one that ran, and a room's
                past is misremembered the moment the two look alike.
              */}
              <Chip
                size="small"
                label={statusLabel(lease.status)}
                color={
                  lease.status === 'active'
                    ? 'success'
                    : lease.status === 'cancelled'
                      ? 'error'
                      : 'default'
                }
                variant={lease.status === 'finalized' ? 'outlined' : 'filled'}
              />
              {isTermRunOut(lease) && (
                <Chip size="small" color="warning" icon={<WarningAmberIcon />} label="Hết hạn" />
              )}
            </Stack>

            <Stack
              direction="row"
              spacing={2}
              sx={{ mt: 1, flexWrap: 'wrap', rowGap: 0.5, columnGap: 2 }}
            >
              {lease.room?.building && (
                <BandFact label="Toà nhà" value={lease.room.building.displayName} />
              )}
              <BandFact label="Ngày lập hồ sơ" value={formatDate(lease.createdAt)} />
              {lease.tenant?.phone && <BandFact label="SĐT khách" value={lease.tenant.phone} />}
            </Stack>
          </Box>

          <Stack
            direction="row"
            spacing={2}
            sx={{ alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', rowGap: 1 }}
          >
            {/*
              Only while the tenancy is running. "Còn 0 tháng" on a tenancy that
              ended in March states something false, and there is no honest
              number to put here — so there is no field.
            */}
            {remaining !== null && (
              <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                <Typography variant="overline" color="text.secondary">
                  Thời gian hiệu lực
                </Typography>
                <Typography variant="h6" component="p">
                  {remaining}
                </Typography>
              </Box>
            )}
            {/*
              Withheld on a finished tenancy rather than offered and refused:
              the API answers 409, and a control that cannot work is worse than
              no control.
            */}
            {lease.status === 'active' && (
              <Button variant="contained" startIcon={<EditIcon />} onClick={onEdit}>
                Chỉnh sửa hợp đồng
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

function TermsCard({ lease }: { lease: Lease }) {
  const isCancelled = lease.status === 'cancelled'
  const ranPastTerm =
    lease.moveOutDate !== null &&
    new Date(lease.moveOutDate).getTime() > new Date(lease.expectedEndDate).getTime()

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">Điều khoản hợp đồng</Typography>

          {/*
            Money first. The edit control now lives in the summary band above —
            one place for the actions on this tenancy, rather than one per card.
          */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={3}
            sx={{ flexWrap: 'wrap', rowGap: 2 }}
          >
            <Field
              label="Tiền thuê hàng tháng"
              value={`${formatMoney(lease.baseRent)} / tháng`}
              emphasis
            />
            {/*
              The deposit with the months it was agreed in. The amount alone
              cannot be checked against anything — the months are what was
              actually negotiated, and the amount follows from them and the rent
              agreed at signing.
            */}
            <Field
              label="Tiền cọc đảm bảo"
              value={formatMoney(lease.depositAmount)}
              hint={`${lease.depositMonths} tháng tiền thuê`}
              emphasis
            />
            <Field label="Thời hạn" value={`${lease.durationMonths} tháng`} />
            {/*
              `occupantCount` is NOT repeated here. It already reads on the
              occupants card under "Tính tiền cho", with the caption that keeps
              it distinct from the people recorded — a second copy would be a
              second label for one fact, free to drift from the first.
            */}
          </Stack>

          <Divider />

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={3}
            sx={{ flexWrap: 'wrap', rowGap: 2 }}
          >
            {/*
              A cancelled tenancy's dates describe an agreement, not an
              occupancy — nobody lived a day of it. "Started" would state as
              fact something that never happened, so it says what was arranged
              instead.
            */}
            <Field
              label={isCancelled ? 'Dự kiến bắt đầu' : 'Ngày bắt đầu hiệu lực'}
              value={formatDate(lease.startDate)}
            />
            {/*
              Both dates, where they differ. What was agreed, and what happened.
              Each shown as the last day COVERED, never as the exclusive
              boundary the API reports — see dates.ts.
            */}
            <Field
              label="Ngày kết thúc thoả thuận"
              value={formatCoveredThrough(lease.expectedEndDate)}
              hint={
                isCancelled
                  ? 'Đây là thoả thuận. Không có ngày nào thực sự ở'
                  : `${lease.durationMonths} tháng kể từ ngày bắt đầu`
              }
            />
            {/*
              The date a decision was made, not a boundary on days covered — so
              it is shown as itself rather than passed through coveredThrough
              like the two above.
            */}
            {lease.cancelledAt !== null && (
              <Field
                label="Ngày huỷ"
                value={formatDate(lease.cancelledAt)}
                hint="Ghi nhận là chưa từng diễn ra"
              />
            )}
            {lease.moveOutDate !== null && (
              <Field
                label="Thực tế đến hết"
                value={formatCoveredThrough(lease.moveOutDate)}
                hint={ranPastTerm ? 'Ở quá hạn thoả thuận' : 'Trả phòng trong hạn'}
              />
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

export function LeaseDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const leaseId = Number(id)
  const leaseQuery = useLease(leaseId)
  const [editOpen, setEditOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  if (leaseQuery.isPending) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (leaseQuery.error) {
    // A lease that is not there is a different thing from a lease that could
    // not be fetched, and only one of them is worth retrying.
    if (isApiError(leaseQuery.error) && leaseQuery.error.isNotFound) {
      return (
        <EmptyState
          title="Không tìm thấy hợp đồng"
          description="Có thể nó đã bị xoá, hoặc địa chỉ sai."
          action={
            <Button variant="outlined" onClick={() => void navigate('/leases')}>
              Về danh sách hợp đồng
            </Button>
          }
        />
      )
    }
    return (
      <Alert
        severity={isApiError(leaseQuery.error) && leaseQuery.error.isTransport ? 'warning' : 'error'}
        action={
          <Button color="inherit" size="small" onClick={() => void leaseQuery.refetch()}>
            Thử lại
          </Button>
        }
      >
        <AlertTitle>Không tải được hợp đồng này</AlertTitle>
        {errorMessage(leaseQuery.error)}
      </Alert>
    )
  }

  const lease = leaseQuery.data
  const room = lease.room
  const roomLabel = room
    ? room.building
      ? `${room.roomCode} · ${room.building.displayName}`
      : room.roomCode
    : `Room #${lease.roomId}`

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link component={RouterLink} to="/leases" underline="hover" color="inherit">
          Hợp đồng
        </Link>
        <Typography color="text.primary">{roomLabel}</Typography>
      </Breadcrumbs>

      <SummaryBand lease={lease} onEdit={() => setEditOpen(true)} />

      {lease.status === 'cancelled' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <AlertTitle>Hợp đồng này chưa từng diễn ra</AlertTitle>
          Đã huỷ ngày {formatDate(lease.cancelledAt)} và không ai từng ở phòng này.
          Danh sách người ở và hoá đơn nhận phòng vẫn được giữ, làm bằng chứng
          cho những gì đã thoả thuận rồi bỏ dở.
        </Alert>
      )}

      {isTermRunOut(lease) && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Đã hết hạn thoả thuận</AlertTitle>
          Không xuất thêm được hoá đơn nào cho hợp đồng này, và phòng vẫn bị giữ
          cho tới khi trả phòng hoặc gia hạn.
        </Alert>
      )}

      {/*
        Two columns on a desktop, stacked on a phone with the billing history
        last: on a small screen the terms are what the screen was opened for,
        and the billing is what is scrolled to.
      */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', [MOBILE_BREAKPOINT]: 'minmax(0, 3fr) minmax(0, 2fr)' },
          gap: 2,
          alignItems: 'start',
        }}
      >
        <Stack spacing={2}>
          <TermsCard lease={lease} />
          <OccupantsCard lease={lease} />
          <ContractCard lease={lease} />
        </Stack>
        <LeaseInvoicesPanel lease={lease} />
      </Box>

      <Stack spacing={2} sx={{ mt: 2 }}>
        {/*
          Offered only where the API permits it, on the API's own say-so —
          `cancellable` carries the rule so this screen does not keep a second
          copy of it that could drift.
        */}
        {lease.cancellable && (
          <Box>
            <Button
              color="error"
              variant="outlined"
              startIcon={<EventBusyIcon />}
              onClick={() => setCancelOpen(true)}
            >
              Huỷ hợp đồng
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Dành cho khách đã ký nhưng không bao giờ dọn vào. Ghi nhận hợp đồng chưa
              từng diễn ra, và trả phòng về trạng thái trống.
            </Typography>
          </Box>
        )}

        {/*
          Withholding the action is the difficulty this addresses, so the reason
          is stated rather than left as an absence. An owner looking for a way
          to close a tenancy that has been billed needs telling what to look for
          instead — otherwise they hunt for a control that was never there.
        */}
        {lease.status === 'active' && !lease.cancellable && lease.hasBilledMonth && (
          <Alert severity="info">
            <AlertTitle>Không huỷ được hợp đồng này</AlertTitle>
            Đã xuất hoá đơn tháng, tức là đã có người ở. Hợp đồng đã xuất hoá đơn thì
            kết thúc bằng cách ghi nhận trả phòng.
          </Alert>
        )}
      </Stack>

      <EditTermsDialog open={editOpen} lease={lease} onClose={() => setEditOpen(false)} />
      <CancelLeaseDialog open={cancelOpen} lease={lease} onClose={() => setCancelOpen(false)} />
    </Box>
  )
}
