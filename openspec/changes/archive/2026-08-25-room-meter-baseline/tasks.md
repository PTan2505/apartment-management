# Tasks

## 1. A room records where its meter stood

- [x] 1.1 Record the reading a room was added at. NULLABLE, no backfill, and zero accepted as a stated value — "nobody has said" and "the meter reads zero" are different facts, and a defaulted column cannot tell them apart. Conflating them is what would charge an owner for a meter's whole history as one month's cost.
- [x] 1.2 Accept it when creating a room, refuse a negative, and report it on the room.
- [x] 1.3 Do NOT accept it when updating. It describes a moment; once a tenancy or vacancy record exists the room's position comes from those, so an edit would either do nothing visible or rewrite the basis of costs already recorded.
- [x] 1.4 Add it as a FOURTH dated candidate in the existing meter-position resolution, dated at the room's creation — not as a fallback consulted when the other three are empty. A fallback is a second code path free to disagree with the first; ordering by date is the rule that function already applies.
- [x] 1.5 `tsc --noEmit`, then verify by curl: a room with a reading, one without, one with zero, a negative refused, and update refusing it.

## 2. A never-let room can be costed

- [x] 2.1 Narrow the vacancy-round exclusion: report a never-let room that HAS a known position. That room is the case the round exists for — it stands empty, its meter runs, and nothing else will ever produce a reading for it before its first tenancy.
- [x] 2.2 Keep excluding a room with no reading anywhere. Recording a vacancy for it is still refused, and a row that cannot be acted on is worse than an omission.
- [x] 2.3 A room's first lease defaults its opening reading from the room's recorded figure instead of refusing for having nothing to fall back on.

## 3. The room form

- [x] 3.1 A meter reading field when creating, optional, not blocking.
- [x] 3.2 Explain what it buys — without it, every month the room stands empty before its first tenancy is electricity the owner pays for and cannot record. An unexplained number field on a form gets skipped.
- [x] 3.3 Say it is a STARTING POINT, not a charge. Nothing is billed from it; every charge is a difference between it and a later reading.
- [x] 3.4 No such field when editing.
- [x] 3.5 Typecheck and build the frontend.

## 4. Verification

- [x] 4.1 **Reproduce the gap on current code first**: a never-let room is absent from the vacancy round and recording one is refused, so its empty months cannot be costed at all.
- [x] 4.2 Create a room stating 8.432; confirm the room reports it and its known position IS that figure.
- [x] 4.3 **That room now appears in the vacancy round**, opening from 8.432 — and record it, confirming the cost is the difference and not 8.432 × the rate.
- [x] 4.4 A room created with no reading is still absent from the round, and recording one is still refused.
- [x] 4.5 A room created stating ZERO appears in the round opening from 0 — distinct from the case above, which is the whole reason the column is nullable.
- [x] 4.6 **A tenancy's readings supersede it**: let the room, record readings, and confirm the room's position comes from the tenancy rather than the opening figure.
- [x] 4.7 A room's first lease defaults its opening reading from the room's figure.
- [x] 4.8 A negative reading is refused; updating a room with a reading is refused or ignored.
- [x] 4.9 **Nothing already correct changed**: rooms created without a reading behave exactly as before, and the billing round, vacancy round and revenue report are unaffected for them.
- [x] 4.10 On the screen: the field appears when creating with its explanation, and is absent when editing.
- [x] 4.11 Remove the verification data.
