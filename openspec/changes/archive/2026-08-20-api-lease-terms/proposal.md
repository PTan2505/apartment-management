## Why

A lease has no rent of its own. Billing reads the room's current base rent every time an invoice is generated, which means the room and the agreement cannot disagree — and they need to.

Two consequences follow, and both are wrong:

- **Changing a room's rent silently re-prices a running lease.** An owner raising the asking rent for the next tenant changes what the current one is billed from that moment on. The agreement said one number; the next invoice says another.
- **Two tenancies of the same room must cost the same.** Rent negotiated with a particular tenant cannot be recorded at all without editing the room, which then affects every other lease of that room.

Separately, deposits are not recorded anywhere. A deposit is a term of the agreement — typically a number of months' rent held by the owner — and it is needed before the money side of it can be built.

This change records both on the lease, where the agreement lives.

## What Changes

- Add `baseRent` to a lease, defaulting to the room's base rent at creation and overridable, following the pattern `startMeterReading` already uses on this same endpoint: a sensible default that the owner can correct without editing something else.
- Add `depositMonths` to a lease — the deposit expressed as a number of months' rent, which is how it is agreed in practice. Required, and may be zero for a lease with no deposit; recording nothing is not the same as recording none.
- Report a derived `depositAmount` (`depositMonths × baseRent`) alongside it, so callers do not each recompute it. Derived rather than stored, matching how expected end date, status, and tenant already work on a lease — a stored copy could contradict the two values it comes from.
- **BREAKING (behaviour):** invoices take rent from the lease rather than from the room. Changing a room's rent no longer affects any existing lease, running or finished — only leases created afterwards.

Deliberately out of scope:

- **Collecting the deposit.** This change records what was agreed, not money moving. The move-in invoice that charges it belongs to the billing change, which is where every other amount is charged.
- **Deciding whether to refund it at move-out.** That decision is part of the money side too, and recording a refund of something never recorded as collected would be an odd half.
- **Changing rent on a running lease.** Confirmed as not wanted: a lease has fixed terms, and a rent change means a new agreement.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lease`: creation gains an optional agreed rent and a required deposit in months; a lease reports its rent and its derived deposit amount.
- `invoice`: the base rent copied onto an invoice comes from the lease rather than the room.
- `room`: the effect of changing a room's base rent is restated — it already did not alter issued invoices, and now does not affect existing leases at all.

## Impact

**Database.** Two columns on `Lease`: `baseRent` (matching the room's precision) and `depositMonths`. Both `NOT NULL`, so existing rows need a backfill — `baseRent` from the lease's room, `depositMonths` to zero, which is the only honest value for an agreement that never recorded one.

**Code.** Lease creation resolves the rent the way it already resolves the meter reading. Invoice generation reads `lease.baseRent` instead of `lease.room.baseRent` — a one-line change with a spec-level consequence.

**Existing invoices.** Untouched. They already store the rent that applied when issued, which is why this can change without rewriting history.

**Downstream.** Required by the billing change, which charges the deposit on a move-in invoice and needs a per-lease rent to bill a month in advance.
