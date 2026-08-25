## Why

A tenancy signed in advance that the tenant backs out of cannot be closed at all. Not awkwardly — at all.

Reproduced against the running system: a lease starting 01/12/2026, signed 23/08/2026, deposit two months. Both sensible answers are refused.

```
move-out dated before the start  →  400  "Move-out date cannot precede the lease start date"
move-out dated on the start      →  400  "This tenancy covered no days in the month it ended"
```

Both refusals are correct. Nobody occupied a single day, so a move-out is a description of something that did not happen: there is no closing meter reading to take, no final month to bill, no days of occupancy to prorate. The system is right to refuse, and then offers nothing else.

The consequences persist and compound:

- **The room is held forever.** It reports itself as let, so it cannot be offered to anybody else — the leases screen will not list it as available and the create form will not show it.
- **The move-in invoice sits unpaid indefinitely**, counted as outstanding revenue in every report from now on.
- Nothing can be corrected. The lease cannot be closed, edited into a different shape, or removed.

What is missing is a different operation. Ending a tenancy that happened and cancelling one that never started are not the same event, and the deposit is the reason the difference matters: by the time a tenant changes their mind the owner is usually holding their money, and what becomes of it is a decision — not a calculation.

## What Changes

- **Cancelling a lease**, distinct from recording a move-out. Permitted while no monthly invoice has been issued against it, which is the point past which a tenancy has demonstrably been lived in and billed for. It may be cancelled after the start date has passed: a tenant who promised to arrive and never did is exactly the case this is for.
- A cancelled lease reports itself as cancelled — not as finalized. A tenancy that was never occupied is not one that ran and ended, and a record that cannot tell them apart will be read as history that happened.
- **The room is freed immediately.** That is most of the point.
- **The money is settled by the owner, not computed.** Where nothing was collected, the move-in invoice is voided and there is nothing to decide. Where it was paid, the owner is shown the single figure they are holding and states how much goes back and how much they keep.
- **What is kept becomes revenue.** It is compensation for a room held off the market, and it is money that has stopped being the tenant's. Leaving it outside the revenue report would show an owner as having earned nothing from a month they were paid for.
- A screen for it, on the tenancy. An operation that cannot be reached does not unstick anything.

Deliberately NOT in this change: extending a lease, recording a move-out, and returning a deposit at the end of a tenancy that ran. Those remain deferred together.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lease`: an owner can cancel a lease that has not been billed a monthly invoice; a lease reports `cancelled` as a state of its own; a cancelled lease frees its room.
- `deposit`: a holding can be settled at cancellation — part returned, part kept — and what is kept is recorded as revenue rather than vanishing from the books.
- `web-leases`: the tenancy screen offers cancellation where it is permitted, showing what is held before the owner commits, and withholds it where it is not.

## Impact

- `backend/prisma/schema.prisma` — a lease needs to record that it was cancelled and when. Migration required.
- `backend/src/modules/leases/` — the operation, its guards, and the derived state.
- `backend/src/modules/deposits/` — settling a holding at cancellation.
- `backend/src/modules/rooms/` — no change: occupancy is derived from `moveOutDate IS NULL` today, and a cancelled lease must stop matching that. This is the one place where getting it wrong leaves a room held by a tenancy that no longer exists.
- `frontend/src/features/leases/` — the action and its reconciliation dialog.
- No change to how revenue is computed: what the owner keeps is recorded through the existing ad-hoc charge and deposit-deduction machinery, which the revenue report already reads correctly.
