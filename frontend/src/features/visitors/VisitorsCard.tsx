import { useState } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import DescriptionIcon from '@mui/icons-material/Description'
import PersonAddIcon from '@mui/icons-material/PersonAdd'

import { EditOccupantCountDialog } from '@/features/leases/EditOccupantCountDialog'
import { IdCardSides } from '@/features/visitors/IdCardSides'
import { ResidenceFilingDialog } from '@/features/visitors/ResidenceFilingDialog'
import { VisitorFormDialog } from '@/features/visitors/VisitorFormDialog'
import { formatDate } from '@/features/leases/dates'
import { errorMessage } from '@/lib/error-messages'
import { sexLabel, visitorStateColor, visitorStateLabel } from '@/features/visitors/labels'
import {
  useCancelVisitor,
  useCreateVisitor,
  useLeaseVisitors,
  useUpdateVisitor,
} from '@/features/visitors/hooks'
import type { Lease } from '@/features/leases/types'
import type { Visitor, VisitorInput } from '@/features/visitors/types'

function VisitorRow({
  visitor,
  onEdit,
  onCancel,
  onFixCount,
}: {
  visitor: Visitor
  onEdit: () => void
  onCancel: () => void
  onFixCount: () => void
}) {
  const closed = visitor.state === 'finished' || visitor.state === 'cancelled'

  return (
    <Box sx={{ opacity: closed ? 0.65 : 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
        <Box>
          <Typography sx={{ fontWeight: 600 }}>{visitor.fullName}</Typography>
          <Typography variant="caption" color="text.secondary">
            {sexLabel(visitor.sex)} · {formatDate(visitor.dateOfBirth)} ·{' '}
            {visitor.idCardNumber}
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'flex-start' }}>
          <Chip
            size="small"
            color={visitorStateColor(visitor.state)}
            variant={closed ? 'outlined' : 'filled'}
            label={visitorStateLabel(visitor.state)}
          />
          {visitor.addedByStaff && <Chip size="small" variant="outlined" label="Nhà trọ ghi" />}
        </Stack>
      </Box>

      <Typography variant="body2" sx={{ mt: 0.5 }}>
        {formatDate(visitor.arrivesOn)} → {formatDate(visitor.expectedUntil)}
        {/*
          The day count only once the stay has begun. An upcoming stay has run
          zero days, which is true and reads as a mistake — "0 ngày" beside two
          future dates looks like a number that failed to arrive.
        */}
        {visitor.state !== 'upcoming' && (
          <Box component="span" color="text.secondary">
            {' · '}
            {visitor.stayDays} ngày
          </Box>
        )}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Quan hệ: {visitor.relationToSignatory} · Thường trú: {visitor.permanentAddress}
      </Typography>
      {visitor.note && (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          {visitor.note}
        </Typography>
      )}

      {/*
        Named consequence, offered remedy, and NOTHING done automatically.

        Changing the billed occupant count because of a form the tenant filled
        in themselves is the kind of surprise that makes people stop filling in
        forms. So this says what is true and hands over the existing control.
      */}
      {visitor.needsAttention && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          <AlertTitle sx={{ mb: 0.5 }}>
            Đã ở {visitor.stayDays} ngày, quá {visitor.overlongAfterDays} ngày
          </AlertTitle>
          <Typography variant="body2">
            Người này đang được nhà trọ cho ở, nhưng{' '}
            <strong>số người tính tiền của hợp đồng không bao gồm họ</strong> — nước và các
            khoản tính theo đầu người vẫn tính như cũ.
          </Typography>
          <Button size="small" sx={{ mt: 1 }} onClick={onFixCount}>
            Sửa số người tính tiền
          </Button>
        </Alert>
      )}
      {visitor.isOverlong && !visitor.needsAttention && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          Lần ở này từng dài hơn {visitor.overlongAfterDays} ngày.
        </Typography>
      )}

      <IdCardSides visitor={visitor} />

      {!closed && (
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button size="small" onClick={onEdit}>
            Sửa
          </Button>
          <Button size="small" color="warning" onClick={onCancel}>
            Huỷ đăng ký
          </Button>
        </Stack>
      )}
    </Box>
  )
}

/**
 * Who is STAYING in the room, besides the people on the tenancy.
 *
 * ── Why this is its own card, below the occupants and not inside them ───────
 *
 * The occupant list is a register of the people the owner holds details for;
 * `occupantCount` is what the utilities are BILLED on; this is a log of guests.
 * Three populations, and only the middle one is money. A reader who merges them
 * goes looking for a water charge that is not there — which is why the overlong
 * warning above states, in words, that the count does not include these people.
 *
 * Nothing in this card changes a charge.
 */
export function VisitorsCard({ lease }: { lease: Lease }) {
  const visitorsQuery = useLeaseVisitors(lease.id)
  const create = useCreateVisitor(lease.id)
  const update = useUpdateVisitor(lease.id)
  const cancel = useCancelVisitor(lease.id)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Visitor | null>(null)
  const [filingOpen, setFilingOpen] = useState(false)
  const [countOpen, setCountOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const visitors = visitorsQuery.data?.data ?? []
  // Only a stay that is happening is worth filing for; the dialog refuses a
  // cancelled one anyway, and offering it would be offering a dead end.
  const filable = visitors.filter((visitor) => visitor.state !== 'cancelled')
  const attention = visitors.filter((visitor) => visitor.needsAttention).length

  function openForm(visitor: Visitor | null) {
    setEditing(visitor)
    setError(null)
    setFormOpen(true)
  }

  async function submit(input: VisitorInput) {
    setError(null)
    try {
      if (editing === null) {
        await create.mutateAsync(input)
      } else {
        await update.mutateAsync({ id: editing.id, patch: input })
      }
      setFormOpen(false)
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  async function runCancel(visitor: Visitor) {
    setError(null)
    try {
      await cancel.mutateAsync(visitor.id)
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1.5}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Khách ghé / ở lại
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Không tính vào số người tính tiền. Dùng để khai tạm trú.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                startIcon={<DescriptionIcon />}
                onClick={() => setFilingOpen(true)}
              >
                Tờ khai CT01
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => openForm(null)}
              >
                Khai khách
              </Button>
            </Stack>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          {attention > 0 && (
            <Alert severity="warning" variant="outlined">
              {attention} người đang ở quá {visitors[0]?.overlongAfterDays ?? 14} ngày.
            </Alert>
          )}

          {visitorsQuery.isPending ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : visitorsQuery.error ? (
            <Alert severity="error">{errorMessage(visitorsQuery.error)}</Alert>
          ) : visitors.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Chưa có ai được khai đến ở phòng này.
            </Typography>
          ) : (
            <Stack divider={<Divider />} spacing={1.5}>
              {visitors.map((visitor) => (
                <VisitorRow
                  key={visitor.id}
                  visitor={visitor}
                  onEdit={() => openForm(visitor)}
                  onCancel={() => void runCancel(visitor)}
                  onFixCount={() => setCountOpen(true)}
                />
              ))}
            </Stack>
          )}
        </Stack>
      </CardContent>

      <VisitorFormDialog
        open={formOpen}
        visitor={editing}
        signatoryName={lease.tenant?.fullName ?? null}
        busy={create.isPending || update.isPending}
        error={error}
        onClose={() => setFormOpen(false)}
        onSubmit={(input) => void submit(input)}
      />

      <ResidenceFilingDialog
        open={filingOpen}
        leaseId={lease.id}
        visitors={filable}
        onClose={() => setFilingOpen(false)}
        onRecordSignatoryNumber={null}
      />

      <EditOccupantCountDialog
        open={countOpen}
        lease={lease}
        onClose={() => setCountOpen(false)}
      />
    </Card>
  )
}
