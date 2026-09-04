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
import { formatCoveredThrough, formatDate, isTermRunOut } from '@/features/leases/dates'
import { useLease } from '@/features/leases/hooks'
import { CancelLeaseDialog } from '@/features/leases/CancelLeaseDialog'
import { ContractCard } from '@/features/leases/ContractCard'
import { EditTermsDialog } from '@/features/leases/EditTermsDialog'
import { OccupantsCard } from '@/features/leases/OccupantsCard'
import type { Lease } from '@/features/leases/types'

/** The three states a tenancy can be in, as an owner would name them. */
function statusLabel(status: Lease['status']): string {
  if (status === 'active') return 'Đang thuê'
  return status === 'cancelled' ? 'Đã huỷ' : 'Đã kết thúc'
}

/** A labelled fact. Enough of them that a component beats repeating the markup. */
function Field({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Box>
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      )}
    </Box>
  )
}

function TermsCard({ lease, onEdit }: { lease: Lease; onEdit: () => void }) {
  const isRunning = lease.status === 'active'
  const isCancelled = lease.status === 'cancelled'
  const ranPastTerm =
    lease.moveOutDate !== null &&
    new Date(lease.moveOutDate).getTime() > new Date(lease.expectedEndDate).getTime()

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Typography variant="h6">Điều khoản</Typography>
            {/*
              Withheld on a finished tenancy rather than offered and refused:
              the API answers 409, and a control that cannot work is worse than
              no control.
            */}
            {isRunning && (
              <Button size="small" startIcon={<EditIcon />} onClick={onEdit}>
                Sửa
              </Button>
            )}
          </Box>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={3}
            sx={{ flexWrap: 'wrap', rowGap: 2 }}
          >
            <Field label="Giá thuê" value={`${formatMoney(lease.baseRent)} / tháng`} />
            <Field label="Thời hạn" value={`${lease.durationMonths} tháng`} />
            {/*
              The deposit with the months it was agreed in. The amount alone
              cannot be checked against anything — the months are what was
              actually negotiated, and the amount follows from them and the rent
              agreed at signing.
            */}
            <Field
              label="Tiền cọc"
              value={formatMoney(lease.depositAmount)}
              hint={`${lease.depositMonths} tháng tiền thuê`}
            />
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
              label={isCancelled ? 'Dự kiến bắt đầu' : 'Bắt đầu'}
              value={formatDate(lease.startDate)}
            />
            {/*
              Both dates, where they differ. What was agreed, and what happened.
              Each shown as the last day COVERED, never as the exclusive
              boundary the API reports — see dates.ts.
            */}
            <Field
              label="Thoả thuận đến hết"
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

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 1,
          flexWrap: 'wrap',
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h5" component="h2">
            {roomLabel}
          </Typography>
          {/*
            Said out loud either way, because a blank name reads as one that
            failed to load — but the two absences are not the same thing.

            A finished tenancy names whoever held it at the end, so an absent
            name there means the record never had one. A RUNNING tenancy with
            nobody responsible is the one worth flagging: the last occupant left
            before a move-out was recorded, and nobody currently answers for it.
          */}
          <Typography
            variant="body2"
            color={
              lease.tenant?.fullName
                ? 'text.secondary'
                : lease.status === 'active'
                  ? 'warning.main'
                  : 'text.secondary'
            }
          >
            {lease.tenant?.fullName ??
              (lease.status === 'active' ? 'Chưa ai đứng tên' : 'Không có người đứng tên')}
            {lease.tenant?.phone ? ` · ${lease.tenant.phone}` : ''}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {/*
            Cancelled reads as its own state rather than as "Ended". A tenancy
            that never happened is not one that ran, and a room's past is
            misremembered the moment the two look alike.
          */}
          <Chip
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
            <Chip color="warning" icon={<WarningAmberIcon />} label="Hết hạn" />
          )}
        </Stack>
      </Box>

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

      <Stack spacing={2}>
        <TermsCard lease={lease} onEdit={() => setEditOpen(true)} />
        <OccupantsCard lease={lease} />
        <ContractCard lease={lease} />

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
