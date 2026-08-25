import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { isApiError } from '@/lib/api-error'
import { formatMoney } from '@/lib/format'
import { useCancelLease } from '@/features/leases/hooks'
import type { Lease } from '@/features/leases/types'

interface CancelLeaseDialogProps {
  open: boolean
  lease: Lease
  onClose: () => void
}

/**
 * A money field's value while the owner is filling it in.
 *
 * Empty is a real state and NOT zero. Returning nothing and having decided
 * nothing are different, and only one of them should let the confirm button
 * light up.
 */
type Entry = string

function parse(entry: Entry): number | null {
  if (entry.trim() === '') return null
  const value = Number(entry)
  return Number.isFinite(value) && value >= 0 ? value : null
}

/**
 * Recording that a tenancy never took place, and dividing whatever deposit is
 * held against it.
 *
 * ── Why this is not a move-out ──────────────────────────────────────────────
 *
 * A move-out closes a tenancy that happened: it takes a closing meter reading,
 * bills a final month, and prorates the days lived in. A tenant who signed in
 * advance and then backed out gives it none of those, and the API rightly
 * refuses both dates an owner would reach for — before the start, and on it.
 * Before this existed, those two refusals were the whole of the answer, and the
 * lease stayed stuck with its room held forever.
 *
 * ── Why neither amount is filled in for you ─────────────────────────────────
 *
 * Returning the whole deposit and keeping the whole deposit are both perfectly
 * ordinary outcomes, so there is no figure that is right often enough to
 * suggest. A default here would be a decision made on the owner's behalf and
 * accepted without being noticed — and this one is not the system's to make:
 * nothing in the record says whether a tenant who changed their mind gets their
 * money back.
 */
export function CancelLeaseDialog({ open, lease, onClose }: CancelLeaseDialogProps) {
  const cancelMutation = useCancelLease()
  const [returned, setReturned] = useState<Entry>('')
  const [kept, setKept] = useState<Entry>('')
  const [error, setError] = useState<string | null>(null)

  const held = lease.depositHeld
  // Nothing was ever collected — the move-in bill went unpaid. There is no
  // holding, so there is nothing to divide and no figures to ask for.
  const hasHolding = held > 0

  useEffect(() => {
    if (!open) return
    setReturned('')
    setKept('')
    setError(null)
  }, [open])

  const returnedValue = parse(returned)
  const keptValue = parse(kept)
  const bothEntered = returnedValue !== null && keptValue !== null
  const entered = (returnedValue ?? 0) + (keptValue ?? 0)
  const accountsForHolding = bothEntered && entered === held

  // Checked as the amounts are typed rather than on submit. The API refuses a
  // settlement that does not add up, and being refused after committing is a
  // worse way to learn it than being told while there is still a field to fix.
  const blocked = hasHolding && !accountsForHolding

  async function handleConfirm() {
    setError(null)
    try {
      await cancelMutation.mutateAsync({
        id: lease.id,
        settlement: hasHolding
          ? { depositReturned: returnedValue ?? 0, depositKept: keptValue ?? 0 }
          : null,
      })
      onClose()
    } catch (cause) {
      setError(isApiError(cause) ? cause.message : 'Could not cancel this tenancy.')
    }
  }

  const isSubmitting = cancelMutation.isPending
  const roomLabel = lease.room?.roomCode ?? `Room #${lease.roomId}`

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Cancel this tenancy</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <DialogContentText>
            This records that the tenancy never took place — not that it ended.
            Nobody occupied {roomLabel}, so there is no final month to bill and
            no meter reading to take. The room becomes available immediately.
          </DialogContentText>

          {error && <Alert severity="error">{error}</Alert>}

          {hasHolding ? (
            <>
              <Alert severity="info" icon={false}>
                <AlertTitle sx={{ mb: 0.5 }}>
                  You are holding {formatMoney(held)}
                </AlertTitle>
                Say how much goes back to the tenant and how much you keep.
                Whether they get it back is your decision — nothing in the
                record settles it.
              </Alert>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Returned to tenant"
                  type="number"
                  fullWidth
                  value={returned}
                  onChange={(event) => setReturned(event.target.value)}
                  slotProps={{ htmlInput: { min: 0, step: 1000 } }}
                />
                <TextField
                  label="You keep"
                  type="number"
                  fullWidth
                  value={kept}
                  onChange={(event) => setKept(event.target.value)}
                  slotProps={{ htmlInput: { min: 0, step: 1000 } }}
                />
              </Stack>

              {/*
                The running total, always visible once either field is touched.
                Shown as an arithmetic fact rather than only as an error, so the
                owner can see it come out right as they type instead of only
                seeing it come out wrong.
              */}
              {(returned !== '' || kept !== '') && (
                <Box>
                  <Typography
                    variant="body2"
                    color={accountsForHolding ? 'success.main' : 'error.main'}
                  >
                    {formatMoney(entered)} of {formatMoney(held)} accounted for
                    {accountsForHolding
                      ? ''
                      : bothEntered
                        ? entered > held
                          ? ` — ${formatMoney(entered - held)} too much`
                          : ` — ${formatMoney(held - entered)} short`
                        : ' — fill in both amounts'}
                  </Typography>
                </Box>
              )}

              {/*
                A consequence that is invisible from this screen and would
                otherwise be met months later in a report, with nothing on it to
                explain where the figure came from.
              */}
              {(keptValue ?? 0) > 0 && (
                <Alert severity="warning">
                  {formatMoney(keptValue ?? 0)} will be recorded as revenue for
                  this month, as a charge against this tenancy.
                </Alert>
              )}
            </>
          ) : (
            <Alert severity="info">
              <AlertTitle>Nothing to settle</AlertTitle>
              No deposit was ever collected for this tenancy — its move-in bill
              was never paid. That bill will be voided, so it stops being
              counted as owed.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Keep tenancy
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => void handleConfirm()}
          disabled={isSubmitting || blocked}
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {isSubmitting ? 'Cancelling…' : 'Cancel tenancy'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
