## 1. The schema

- [x] 1.1 Add five columns to `Lease`, every one NULLABLE: notice period, payment day, opening water reading, reference, handover-signed timestamp
- [x] 1.2 Resist the `NOT NULL DEFAULT` on every one of them — a default states a term for tenancies whose agreements say something else
- [x] 1.3 Enforce the reference's uniqueness in the DATABASE, not in the generator: a generator is what races with itself
- [x] 1.4 Back-fill the reference for existing rows, and only the reference — it names an agreement that exists rather than asserting what it says
- [x] 1.5 Write the migration, and confirm it applies to a database holding the existing leases

## 2. Recording them

- [x] 2.1 Accept the terms when a lease is signed, all optional
- [x] 2.2 Accept corrections to them under the same rules that govern correcting the other terms
- [x] 2.3 Leave an absent term absent when a caller corrects a different one — never demand a term that was never agreed as the price of fixing a rent
- [x] 2.4 Generate the reference at creation, from facts the lease already carries

## 3. Reporting them

- [x] 3.1 Report all five wherever a lease is reported, including in the list
- [x] 3.2 Report an unrecorded term as absent, never as a default
- [x] 3.3 Report a water reading of zero as zero, distinguishably from no reading at all

## 4. Verification

- [x] 4.1 `tsc --noEmit` passes and `npm run codes:check` still matches
- [x] 4.2 `curl` a lease created BEFORE this change and confirm every new term reads as absent — not zero, not a default
- [x] 4.3 `curl` a lease created with a water reading of zero and confirm it is distinguishable from one with none
- [x] 4.4 Correct the rent of a lease with no notice period recorded, and confirm it succeeds and leaves the notice period absent
- [x] 4.5 Confirm every existing lease received a reference, and that no two share one
- [x] 4.6 Failure paths: a payment day outside 1–31, a negative water reading, an unauthenticated request
- [x] 4.7 Confirm the lease-detail screen still renders unchanged against the new response, in a visible browser — this change touches what that screen reads, so `curl` is not enough
- [x] 4.8 Confirm the screen shows nothing for the terms it now receives as null, rather than a placeholder — the rule it already follows, now with real nulls arriving to test it

## 5. What the implementation settled

- [x] 5.1 The reference is built AFTER the insert, from the id — unique by construction, so the generator cannot collide with itself, needs no retry loop and does not race a concurrent creation. The unique index still enforces it; this is what stops it ever firing
- [x] 5.2 The migration back-fills the reference with the SAME shape the service generates, so a row named by the migration and one named today read alike
- [x] 5.3 `updateLeaseSchema` is `.partial()` over the whole object, which is what makes correcting one term never demand another — checked against a lease holding none of them
