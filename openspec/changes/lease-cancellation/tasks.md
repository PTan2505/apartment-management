# Tasks

## 1. A lease can be cancelled

- [x] 1.1 Record when a lease was cancelled, alongside the date it recorded a move-out. Nullable, no backfill — every existing lease is running or finalized, and an empty column says so correctly.
- [x] 1.2 Derive a third status from it. Keep status derived rather than stored: a stored enum could say "cancelled" on a lease that also holds a move-out date, and derivation is what stops the two contradicting each other.
- [x] 1.3 Refuse cancellation where a monthly invoice has been issued, naming the move-out as what is wanted instead. That invoice is the point past which a tenancy has demonstrably been lived in.
- [x] 1.4 Refuse cancelling a lease that has recorded a move-out, or one already cancelled.
- [x] 1.5 Do NOT restrict it by start date. A tenant who promised to arrive and never did leaves a lease whose start date has passed and which nobody occupied — the case this exists for.

## 2. The room is freed — every test, not most of them

The occupancy test `moveOutDate: null` appears in four places. Missing one leaves a room held by a tenancy that no longer exists, which is the defect this change exists to remove.

- [x] 2.1 The room's own `isLet`.
- [x] 2.2 The `vacant` filter on the room listing.
- [x] 2.3 The guard refusing a second lease on a room.
- [x] 2.4 The guard refusing to retire an occupied room. **No screen exercises this one** — it would otherwise be found by an owner months later.
- [x] 2.5 Exclude cancelled leases from the start-date overlap check entirely, rather than comparing their dates. A tenancy that covered no days cannot be overlapped, and treating its dates as occupied would block the very room the cancellation freed.

## 3. The money

- [x] 3.1 Where the move-in invoice is unpaid, void it. It bills a tenancy that never happened; leaving it counts a debt nobody owes in every report from now on.
- [x] 3.2 Where a holding exists, require the owner to state how much is returned and how much is kept, and refuse a pair that does not account for the whole holding.
- [x] 3.3 Settle against the holding as a whole, not per charge. The owner took one payment and will hand back one amount; asking them to split it between deposit and first month invents a distinction they never made.
- [x] 3.4 Record what is kept as revenue, through the existing ad-hoc charge settled by deposit deduction. No new path into the revenue report — two paths into a total is how a total stops adding up.
- [x] 3.5 Record nothing for what is returned. It is the tenant's own money going back, which this system already treats as changing whose hands money is in rather than as earning.
- [x] 3.6 Drive the holding to zero either way, in the same transaction as the cancellation. A lease cancelled while its holding survived would report money held on behalf of a tenancy that does not exist.
- [x] 3.7 `tsc --noEmit` on the backend.

## 4. The screen

- [x] 4.1 Offer cancellation on a tenancy where it is permitted, described as recording that the tenancy never took place — not as ending one.
- [x] 4.2 Where it is not permitted, withhold it AND say that such a tenancy is ended by recording a move-out. An owner who cannot find the action needs telling what to look for.
- [x] 4.3 Show the amount held before the owner confirms, with fields for returned and kept, and neither defaulted: returning everything and keeping everything are both ordinary, and a default is a figure that gets accepted without being decided.
- [x] 4.4 Show as the amounts are entered whether they account for the holding, so a settlement that does not add up is caught before submitting rather than after being refused.
- [x] 4.5 Say plainly that a kept amount is recorded as revenue — a consequence invisible from the screen that would otherwise be met in a report months later.
- [x] 4.6 Where nothing was collected, say there is nothing to settle and ask for no amounts.
- [x] 4.7 Show a cancelled tenancy as distinct from one that ran and ended, in the list and on its own screen.
- [x] 4.8 Typecheck and build the frontend.

## 5. Verification

The defect is that a lease gets stuck, so the verification is that it stops being stuck. Reproduce the original case first, then confirm each way out.

- [x] 5.1 **Reproduce the defect on the current code before changing anything**: a lease starting in the future, both move-out dates refused, room held. Without this the fix is being verified against a problem nobody re-confirmed.
- [x] 5.2 Cancel a lease whose move-in invoice was never paid: invoice voided, lease cancelled, room free.
- [x] 5.3 Cancel a lease whose move-in invoice was paid, returning the whole holding: holding zero, nothing in revenue.
- [x] 5.4 The same, keeping the whole holding: holding zero, the full amount in the revenue report for that month.
- [x] 5.5 The same, split: only the kept part reaches revenue.
- [x] 5.6 A settlement that does not account for the holding is refused and changes nothing.
- [x] 5.7 **The room is genuinely free** — checked four ways, matching the four tests: it reports itself not let, it appears under the vacancy filter, it accepts a new lease, and it can be retired.
- [x] 5.8 A new lease on that room is accepted **starting before the cancelled lease's own start date**, because a cancelled tenancy covered no days to overlap.
- [x] 5.9 Cancelling is refused on a lease that has been issued a monthly invoice, and the message names the move-out.
- [x] 5.10 Cancelling is refused on a finalized lease and on an already-cancelled one.
- [x] 5.11 A cancelled lease still lists its occupants and its move-in invoice — the record of what was agreed and abandoned.
- [x] 5.12 **Nothing already correct changed**: a normal move-out still works, a normal deposit refund still works, and the revenue report for a month with no cancellation is unchanged.
- [x] 5.13 On the screen: the action appears where permitted and is absent with an explanation where not; the holding is shown; a mismatched settlement is caught before submitting; the room is offered again afterwards.
- [x] 5.14 Remove the verification data.
