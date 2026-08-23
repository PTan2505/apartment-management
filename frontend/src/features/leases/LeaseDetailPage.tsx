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
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

import { isApiError } from '@/lib/api-error'
import { formatMoney } from '@/lib/format'
import { EmptyState } from '@/components/EmptyState'
import { formatCoveredThrough, formatDate, isTermRunOut } from '@/features/leases/dates'
import { useLease } from '@/features/leases/hooks'
import { EditTermsDialog } from '@/features/leases/EditTermsDialog'
import { OccupantsCard } from '@/features/leases/OccupantsCard'
import type { Lease } from '@/features/leases/types'

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
            <Typography variant="h6">Terms</Typography>
            {/*
              Withheld on a finished tenancy rather than offered and refused:
              the API answers 409, and a control that cannot work is worse than
              no control.
            */}
            {isRunning && (
              <Button size="small" startIcon={<EditIcon />} onClick={onEdit}>
                Edit
              </Button>
            )}
          </Box>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={3}
            sx={{ flexWrap: 'wrap', rowGap: 2 }}
          >
            <Field label="Rent" value={`${formatMoney(lease.baseRent)} / month`} />
            <Field label="Duration" value={`${lease.durationMonths} months`} />
            {/*
              The deposit with the months it was agreed in. The amount alone
              cannot be checked against anything — the months are what was
              actually negotiated, and the amount follows from them and the rent
              agreed at signing.
            */}
            <Field
              label="Deposit"
              value={formatMoney(lease.depositAmount)}
              hint={`${lease.depositMonths} ${lease.depositMonths === 1 ? 'month' : 'months'} of rent`}
            />
          </Stack>

          <Divider />

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={3}
            sx={{ flexWrap: 'wrap', rowGap: 2 }}
          >
            <Field label="Started" value={formatDate(lease.startDate)} />
            {/*
              Both dates, where they differ. What was agreed, and what happened.
              Each shown as the last day COVERED, never as the exclusive
              boundary the API reports — see dates.ts.
            */}
            <Field
              label="Agreed through"
              value={formatCoveredThrough(lease.expectedEndDate)}
              hint={`${lease.durationMonths} months from the start date`}
            />
            {lease.moveOutDate !== null && (
              <Field
                label="Actually through"
                value={formatCoveredThrough(lease.moveOutDate)}
                hint={ranPastTerm ? 'Stayed past the agreed term' : 'Left within the agreed term'}
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
          title="Lease not found"
          description="It may have been removed, or the address may be wrong."
          action={
            <Button variant="outlined" onClick={() => void navigate('/leases')}>
              Back to leases
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
            Retry
          </Button>
        }
      >
        <AlertTitle>Could not load this lease</AlertTitle>
        {isApiError(leaseQuery.error) ? leaseQuery.error.message : 'An unexpected error occurred.'}
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
          Leases
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
              (lease.status === 'active' ? 'Nobody responsible' : 'No tenant recorded')}
            {lease.tenant?.phone ? ` · ${lease.tenant.phone}` : ''}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Chip
            label={lease.status === 'active' ? 'Running' : 'Ended'}
            color={lease.status === 'active' ? 'success' : 'default'}
            variant={lease.status === 'active' ? 'filled' : 'outlined'}
          />
          {isTermRunOut(lease) && (
            <Chip color="warning" icon={<WarningAmberIcon />} label="Term run out" />
          )}
        </Stack>
      </Box>

      {isTermRunOut(lease) && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>The agreed term has run out</AlertTitle>
          No further invoice can be issued for this tenancy, and its room stays
          held against a new one until it is closed or renewed.
        </Alert>
      )}

      <Stack spacing={2}>
        <TermsCard lease={lease} onEdit={() => setEditOpen(true)} />
        <OccupantsCard lease={lease} />
      </Stack>

      <EditTermsDialog open={editOpen} lease={lease} onClose={() => setEditOpen(false)} />
    </Box>
  )
}
