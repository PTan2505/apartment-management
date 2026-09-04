# Tasks

## 1. The API reports the empty rooms

- [x] 1.1 Report, for a month, every active room that stood empty at that month's END and has no vacancy record for it. Judged at the month's end, matching the rule that already refuses the record — "empty during March" and "empty at the end of March" are different questions with the same plausible-sounding name, and getting it wrong offers rows that cannot be acted on.
- [x] 1.2 Exclude a room already recorded for that month, and a retired one. A room out of service is not one the owner is waiting to let.
- [x] 1.3 Report the reading each would open from, resolved by the same function lease creation and invoicing use.
- [x] 1.4 EXCLUDE a room with no known reading at all. Consumption is a difference and there is nothing to subtract from — the API refuses to record one, so reporting it would put a row on the list that cannot be acted on. Substituting zero is worse: it charges the owner for the meter's whole history.
- [x] 1.5 Carry each room's building, and accept a building filter.
- [x] 1.6 `tsc --noEmit`, then verify by curl including the failure paths: already recorded, let at month end, let mid-month, retired, unauthenticated.

## 2. Recording and correcting a cost

- [x] 2.1 List costs with the filters the API offers: building, room, kind, date range.
- [x] 2.2 Show whether the system or the owner recorded it. Equally correctable, not equally expected — an owner should not have to wonder who entered an electricity cost they never typed.
- [x] 2.3 A form that takes a quantity and a rate OR an amount, never both. Offering all three invites an amount typed beside a basis that does not produce it, which the API then silently discards.
- [x] 2.4 Require a description. A kind and an amount with no account of what it was for cannot be checked against anything later.
- [x] 2.5 Correct a cost, including one the system recorded — the mistyped reading is exactly why that is permitted.
- [x] 2.6 Remove a cost, saying REMOVED rather than withdrawn, and that it cannot be undone. An invoice is kept when voided; an expense is not, and one word for both would teach the wrong thing about one of them.

## 3. Closing off a month's empty rooms

- [x] 3.1 Month-and-building picker and the table of outstanding rooms, the same shape as the billing run — the two are the same task and an owner who has learned one has learned the other.
- [x] 3.2 Each row: the room, the reading it opens from, and a field for the new one.
- [x] 3.4 Refuse a reading below the opening one before submitting.
- [x] 3.5 Record per row, not as a batch. One bad reading must not roll back the rest, and a failure must belong to the row that caused it.
- [x] 3.6 A recorded room leaves the list; a failed one stays with its reason.
- [x] 3.7 Where nothing is outstanding, say the month is done.

## 4. Reaching it

- [x] 4.1 Route and navigation entry, replacing the placeholder.
- [x] 4.2 Usable on a phone — the owner may be entering readings while standing in the building.
- [x] 4.3 Typecheck and build the frontend.

## 5. Verification

- [x] 5.1 A building with a mix: a room let all month, a room let mid-month and still let, a room whose tenancy ended mid-month, a never-let room, and a retired room. Only the right ones are listed.
- [x] 5.2 **The mid-month case specifically**: a room let on the 20th is NOT listed, and recording a vacancy for it is refused — the listing and the guard agree.
- [x] 5.3 **The opening reading matches what the recorded cost uses** — checked against the created expense, not against the screen.
- [x] 5.4 A room with no reading at all is absent from the list, and recording a vacancy for it is refused — the listing and the guard agree here too.
- [x] 5.5 One bad reading among several: that row fails and stays, the others are recorded and leave.
- [x] 5.6 A recorded room is absent from the list; the month empties and says so.
- [x] 5.7 Record a cost with a quantity and rate; confirm the amount is their product and that no third figure was accepted.
- [x] 5.8 Correct a system-recorded cost and confirm it saves.
- [x] 5.9 Remove a cost and confirm it is gone from listings and from the revenue report.
- [x] 5.10 **The revenue report changes by exactly what was recorded** — measured before and after, not assumed.
- [x] 5.11 **Nothing already correct changed**: invoices, leases and the billing run behave as they did.
- [x] 5.12 On the screen at phone width.
- [x] 5.13 Remove the verification data.
