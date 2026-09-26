import type { ReactNode } from 'react'
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
import AutorenewIcon from '@mui/icons-material/Autorenew'
import EventBusyIcon from '@mui/icons-material/EventBusy'
import LogoutIcon from '@mui/icons-material/Logout'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

import { isApiError } from '@/lib/api-error'
import { errorMessage } from '@/lib/error-messages'
import { formatMoney } from '@/lib/format'
import { EmptyState } from '@/components/EmptyState'
import { MOBILE_BREAKPOINT } from '@/app/theme'
import {
  departureAgainstTerm,
  formatCoveredThrough,
  formatDate,
  formatOverdueTerm,
  formatRemainingTerm,
  isTermRunOut,
} from '@/features/leases/dates'
import { useLease } from '@/features/leases/hooks'
import { CancelLeaseDialog } from '@/features/leases/CancelLeaseDialog'
import { DepositSettlementCard } from '@/features/leases/DepositSettlementCard'
import { MoveOutDialog } from '@/features/leases/MoveOutDialog'
import { RenewLeaseDialog } from '@/features/leases/RenewLeaseDialog'
import { IdCardCard } from '@/features/customers/IdCardCard'
import { ContractCard } from '@/features/leases/ContractCard'
import { useIsOwner } from '@/features/auth/useAuth'
import { EditTermsDialog } from '@/features/leases/EditTermsDialog'
import { LeaseInvoicesPanel } from '@/features/leases/LeaseInvoicesPanel'
import { LeaseServiceFeesCard } from '@/features/leases/LeaseServiceFeesCard'
import { OccupantsCard } from '@/features/leases/OccupantsCard'
import { PortalLinkCard } from '@/features/leases/PortalLinkCard'
import { isLive, leaseStatusColor, leaseStatusLabel } from '@/features/leases/status'
import type { Lease } from '@/features/leases/types'

/** A labelled fact. Enough of them that a component beats repeating the markup. */
function Field({
  label,
  value,
  hint,
  emphasis = false,
}: {
  label: string
  value: ReactNode
  hint?: string | string[]
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
      {/*
        One line or two. A move-out carries two facts — the last day covered, and
        how that compares with the agreement — and joining them into one sentence
        makes the date hard to find.
      */}
      {(Array.isArray(hint) ? hint : hint ? [hint] : []).map((line) => (
        <Typography key={line} variant="caption" color="text.secondary" component="div">
          {line}
        </Typography>
      ))}
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
  const isOwner = useIsOwner()

  /*
    How near the end it is, or how far past it — the same measurement pointing
    two ways, so one field says both. Emphasised only in the two states that
    need acting on: a mark that applies to every tenancy marks none of them.
  */
  const standing = formatOverdueTerm(lease) ?? formatRemainingTerm(lease)
  const standingColor =
    lease.status === 'overdue'
      ? 'error.main'
      : lease.status === 'dueSoon'
        ? 'warning.main'
        : 'text.primary'
  const standingEmphasis = lease.status === 'overdue' || lease.status === 'dueSoon'
  const tenantName =
    lease.tenant?.fullName ??
    (isLive(lease.status) ? 'Chưa ai đứng tên' : 'Không có người đứng tên')

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
                      !lease.tenant?.fullName && isLive(lease.status)
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
                label={leaseStatusLabel(lease.status)}
                color={leaseStatusColor(lease.status)}
                variant={
                  lease.status === 'finalized' || lease.status === 'upcoming'
                    ? 'outlined'
                    : 'filled'
                }
                icon={lease.status === 'overdue' ? <WarningAmberIcon /> : undefined}
              />
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
              Only while the tenancy is live. "Còn 0 tháng" on a tenancy that
              ended in March states something false, and "quá hạn" on one that
              was handed back states something falser — so there is no field.
            */}
            {standing !== null && (
              <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                {/*
                  One label for both readings. "Thời hạn" would collide with the
                  field of that name in the terms card below, which says how
                  many months were agreed — a different fact entirely.
                */}
                <Typography variant="overline" color="text.secondary">
                  Thời gian hiệu lực
                </Typography>
                <Typography
                  variant="h6"
                  component="p"
                  sx={{ color: standingColor, fontWeight: standingEmphasis ? 700 : undefined }}
                >
                  {standing}
                </Typography>
              </Box>
            )}
            {/*
              Withheld on a finished tenancy rather than offered and refused:
              the API answers 409, and a control that cannot work is worse than
              no control.

              Withheld from a manager for the same reason and a different rule:
              what a signed agreement SAYS is the owner's to revise. Everything
              it says stays readable above — a manager works from these terms
              daily, they simply do not rewrite them.
            */}
            {isOwner && isLive(lease.status) && (
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

/**
 * Said out loud, never left blank.
 *
 * These four are null on every tenancy signed before the columns existed, and
 * an empty space reads as a screen that failed to load rather than as a fact
 * about the agreement.
 */
const KHONG_GHI = 'Chưa ghi nhận'

/**
 * How a move-out compares with the agreed end, as the owner would say it.
 *
 * Three phrasings because there are three cases. "Trả phòng trong hạn" used to
 * cover both an early departure and an on-time one.
 */
const DEPARTURE_WORDS = {
  early: 'Trả phòng trước hạn hợp đồng',
  onTime: 'Trả phòng đúng hạn hợp đồng',
  late: 'Ở quá hạn hợp đồng',
} as const

function TermsCard({ lease }: { lease: Lease }) {
  const isCancelled = lease.status === 'cancelled'

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
            /*
              Gap, not margins. Stack's default spacing is a margin on every
              child but the first, which a wrapped item carries onto the next
              line — so the first field of a wrapped row sits 24px right of
              every other row's first field. Measured at x=305 against 281.
            */
            useFlexGap
            /*
              Spread across the card rather than bunched at the left. The label
              and its value stay together in one Field; what separates is one
              fact from the next, which is what the eye is scanning for.
            */
            sx={{ flexWrap: 'wrap', rowGap: 2, justifyContent: { sm: 'space-between' } }}
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
            /*
              Gap, not margins. Stack's default spacing is a margin on every
              child but the first, which a wrapped item carries onto the next
              line — so the first field of a wrapped row sits 24px right of
              every other row's first field. Measured at x=305 against 281.
            */
            useFlexGap
            /*
              Spread across the card rather than bunched at the left. The label
              and its value stay together in one Field; what separates is one
              fact from the next, which is what the eye is scanning for.
            */
            sx={{ flexWrap: 'wrap', rowGap: 2, justifyContent: { sm: 'space-between' } }}
          >
            {/*
              A cancelled tenancy's dates describe an agreement, not an
              occupancy — nobody lived a day of it. "Started" would state as
              fact something that never happened, so it says what was arranged
              instead.
            */}
            <Field
              label={isCancelled ? 'Dự kiến bắt đầu' : 'Ở từ ngày'}
              value={formatDate(lease.startDate)}
            />
            {/*
              Both dates, where they differ. What was agreed, and what happened.
              Each shown as the last day COVERED, never as the exclusive
              boundary the API reports — see dates.ts.
            */}
            <Field
              label="Hợp đồng đến hết ngày"
              value={formatCoveredThrough(lease.expectedEndDate)}
              hint={
                isCancelled
                  ? 'Đây là thoả thuận. Không có ngày nào thực sự ở'
                  : `Thoả thuận ${lease.durationMonths} tháng`
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
            {/*
              The handed-back day itself — the stored boundary, NOT passed through
              coveredThrough — with the last day covered directly beneath it. The
              label says it is the day the room came back, which is exactly what
              the boundary is; see the exception recorded in dates.ts. It matches
              the occupants' "Rời đi ngày" below, which is the same stored day.
            */}
            {lease.moveOutDate !== null && (
              <Field
                label="Đã trả phòng ngày"
                value={formatDate(lease.moveOutDate)}
                hint={[
                  `Ở đến hết ${formatCoveredThrough(lease.moveOutDate)}`,
                  DEPARTURE_WORDS[departureAgainstTerm(lease.moveOutDate, lease.expectedEndDate)],
                ]}
              />
            )}
          </Stack>

          <Divider />

          {/*
            The terms an owner is asked for by a tenant or needs in a dispute.

            Every row is shown even when empty. Hiding what is null cannot
            distinguish "no notice period was agreed" from "the screen chose not
            to show it", and it makes the card's shape depend on the data, so
            two tenancies side by side have different rows for no visible
            reason.
          */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={3}
            /*
              Gap, not margins. Stack's default spacing is a margin on every
              child but the first, which a wrapped item carries onto the next
              line — so the first field of a wrapped row sits 24px right of
              every other row's first field. Measured at x=305 against 281.
            */
            useFlexGap
            /*
              Spread across the card rather than bunched at the left. The label
              and its value stay together in one Field; what separates is one
              fact from the next, which is what the eye is scanning for.
            */
            sx={{ flexWrap: 'wrap', rowGap: 2, justifyContent: { sm: 'space-between' } }}
          >
            {/*
              Generated, unique, never typed — so it is read here and absent
              from the edit dialog entirely.

              Three fields used to stand beside these two: the notice period,
              the payment day and the opening water reading. All three were
              recorded and read by nothing, and the water reading was worse than
              idle — beside an electricity reading that every invoice consumes,
              a second meter-looking number reads as another billed meter.
            */}
            <Field label="Số hợp đồng" value={lease.reference} />
            <Field
              label="Ngày ký hợp đồng"
              value={
                lease.handoverSignedAt === null
                  ? KHONG_GHI
                  : formatDate(lease.handoverSignedAt)
              }
              hint="Ngày ký hợp đồng giấy với khách"
            />
            {/*
              The renewal chain, shown ONLY where there is one — unlike the
              terms above, which say "not recorded" when empty.

              The difference is what absence means. A tenancy with no signing
              date has a fact nobody wrote down; a tenancy that was signed
              rather than renewed is not missing anything, and a row reading
              "Chưa ghi nhận" would invite the owner to go looking for a
              predecessor that never existed.

              Named, not numbered: "gia hạn từ #266" makes the reader open #266
              to find out which agreement that was.
            */}
            {lease.renewedFrom && (
              <Field
                label="Gia hạn từ"
                value={
                  <Link component={RouterLink} to={`/leases/${lease.renewedFrom.id}`}>
                    {lease.renewedFrom.reference ?? `#${lease.renewedFrom.id}`}
                  </Link>
                }
                hint="Hợp đồng trước của cùng khách, cùng phòng"
              />
            )}
            {lease.renewedTo && (
              <Field
                label="Đã gia hạn thành"
                value={
                  <Link component={RouterLink} to={`/leases/${lease.renewedTo.id}`}>
                    {lease.renewedTo.reference ?? `#${lease.renewedTo.id}`}
                  </Link>
                }
                hint="Hợp đồng tiếp nối sau khi hết hạn"
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
  const [renewOpen, setRenewOpen] = useState(false)
  const [moveOutOpen, setMoveOutOpen] = useState(false)

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

        Each column is its own Stack, and that is not decoration. Left as bare
        grid children, the cards were placed row by row — so the deposit card,
        which appears only once a tenancy has closed, pushed the billing history
        out of the right-hand column and into the left. Recording a move-out
        rearranged the whole screen at the moment the owner least wants to
        re-find things. Columns stated explicitly cannot do that: a card
        appearing or disappearing changes the length of its own column and
        nothing else.
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
          {/*
            Directly under the terms, because that is what these are: money the
            tenancy owes every month, agreed alongside the rent. Above the
            occupants, because the occupant count and the fees are read
            together — the water is per person and the parking is per bike.
          */}
          <LeaseServiceFeesCard lease={lease} />
          <OccupantsCard lease={lease} />
          <ContractCard lease={lease} />
          {lease.tenant !== null && (
            <IdCardCard customerId={lease.tenant.id} name={lease.tenant.fullName} />
          )}
          {/*
            Beneath the tenancy's own papers: the link is one of the things an
            owner hands to the tenant, like the contract above it.
          */}
          <PortalLinkCard lease={lease} />
        </Stack>

        <Stack spacing={2}>
          <LeaseInvoicesPanel lease={lease} />
          {/*
            Under the bills it settles against. Nothing is shown here until a
            move-out is recorded — the card renders nothing before that — and
            when it appears it appears BELOW the billing history rather than
            above it, so the bills stay where they were.
          */}
          <DepositSettlementCard lease={lease} />
        </Stack>
      </Box>

      <Stack spacing={2} sx={{ mt: 2 }}>
        {/*
          Offered only where the API permits it, on the API's own say-so —
          `cancellable` carries the rule so this screen does not keep a second
          copy of it that could drift.
        */}
        {/*
          The most ordinary thing that happens to a tenancy: the tenant stays.
          It existed only in the API — an owner reaching the same outcome by
          hand would re-enter the occupants, settle and re-collect the deposit,
          re-choose the fees, leave a gap between the two agreements, and record
          no link between them.

          Offered while the tenancy is running. A closed or cancelled one has
          nothing to renew, and the API refuses both.
        */}
        {isLive(lease.status) && (
          <Box>
            <Button
              variant="outlined"
              startIcon={<AutorenewIcon />}
              onClick={() => setRenewOpen(true)}
            >
              Gia hạn hợp đồng
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Khách ở tiếp sau khi hết hạn. Đóng hợp đồng này đúng ngày kết thúc và mở hợp đồng
              mới ngay hôm đó, giữ nguyên người ở và tiền cọc.
            </Typography>
          </Box>
        )}

        {/*
          How a tenancy actually ends. It existed only in the API, so the only
          ending an owner could reach was cancelling — which records a tenancy
          as never having happened, and on a tenant who lived here for a year
          would erase the year.
        */}
        {isLive(lease.status) && (
          <Box>
            <Button
              color="error"
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={() => setMoveOutOpen(true)}
            >
              Kết thúc hợp đồng
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Khách đã dọn đi thật. Chốt số điện, xuất hoá đơn tháng cuối, và trả phòng về trạng
              thái trống.
            </Typography>
          </Box>
        )}

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
        {isLive(lease.status) && !lease.cancellable && lease.hasBilledMonth && (
          <Alert severity="info">
            <AlertTitle>Không huỷ được hợp đồng này</AlertTitle>
            Đã xuất hoá đơn tháng, tức là đã có người ở. Hợp đồng đã xuất hoá đơn thì
            kết thúc bằng cách ghi nhận trả phòng.
          </Alert>
        )}
      </Stack>

      <EditTermsDialog open={editOpen} lease={lease} onClose={() => setEditOpen(false)} />
      <MoveOutDialog open={moveOutOpen} lease={lease} onClose={() => setMoveOutOpen(false)} />

      <RenewLeaseDialog
        open={renewOpen}
        lease={lease}
        onRenewed={(successorId) => {
          setRenewOpen(false)
          // Straight to the successor: it is the tenancy that now exists, and
          // it already names the one it renewed.
          navigate(`/leases/${successorId}`)
        }}
        onClose={() => setRenewOpen(false)}
      />

      <CancelLeaseDialog open={cancelOpen} lease={lease} onClose={() => setCancelOpen(false)} />
    </Box>
  )
}
