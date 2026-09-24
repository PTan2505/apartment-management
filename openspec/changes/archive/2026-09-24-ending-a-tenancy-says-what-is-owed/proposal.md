## Why

The three ways a tenancy stops — ending it, renewing it, cancelling it — are
each a one-way door, and each is reached by a single click on a form's submit
button. None of them says anything about money still owed.

That silence is the problem. An owner closing a tenancy whose last two bills
were never paid has just given the room back, and the tenant is gone. The
figure exists on the same screen, in the invoice panel, but it is not in front
of the owner at the moment the decision is made — and after a move-out the
deposit settlement is the only lever left.

Cancelling is worse still: it records the tenancy as never having happened,
with unpaid bills attached to it.

## What Changes

- Ending, renewing or cancelling a tenancy that has unpaid bills SHALL say so,
  in the dialog, before the action is taken — how many and how much.
- All three SHALL ask for confirmation, naming what is about to happen, rather
  than acting on the first click of a submit button.
- The warning states the amount and does not block. Whether to proceed is the
  owner's call — a tenant genuinely leaving does not stop leaving because a
  bill is outstanding.

## Impact

- Affected specs: `web-leases`
- Affected code: `frontend/src/features/leases/MoveOutDialog.tsx`,
  `RenewLeaseDialog.tsx`, `CancelLeaseDialog.tsx`, and a shared warning
  component alongside them
