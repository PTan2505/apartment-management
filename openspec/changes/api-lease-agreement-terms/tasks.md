## 1. The schema

- [ ] 1.1 Add five columns to `Lease`, every one NULLABLE: notice period, payment day, opening water reading, reference, handover-signed timestamp
- [ ] 1.2 Resist the `NOT NULL DEFAULT` on every one of them — a default states a term for tenancies whose agreements say something else
- [ ] 1.3 Enforce the reference's uniqueness in the DATABASE, not in the generator: a generator is what races with itself
- [ ] 1.4 Back-fill the reference for existing rows, and only the reference — it names an agreement that exists rather than asserting what it says
- [ ] 1.5 Write the migration, and confirm it applies to a database holding the existing leases

## 2. Recording them

- [ ] 2.1 Accept the terms when a lease is signed, all optional
- [ ] 2.2 Accept corrections to them under the same rules that govern correcting the other terms
- [ ] 2.3 Leave an absent term absent when a caller corrects a different one — never demand a term that was never agreed as the price of fixing a rent
- [ ] 2.4 Generate the reference at creation, from facts the lease already carries

## 3. Reporting them

- [ ] 3.1 Report all five wherever a lease is reported, including in the list
- [ ] 3.2 Report an unrecorded term as absent, never as a default
- [ ] 3.3 Report a water reading of zero as zero, distinguishably from no reading at all

## 4. Verification

- [ ] 4.1 `tsc --noEmit` passes and `npm run codes:check` still matches
- [ ] 4.2 `curl` a lease created BEFORE this change and confirm every new term reads as absent — not zero, not a default
- [ ] 4.3 `curl` a lease created with a water reading of zero and confirm it is distinguishable from one with none
- [ ] 4.4 Correct the rent of a lease with no notice period recorded, and confirm it succeeds and leaves the notice period absent
- [ ] 4.5 Confirm every existing lease received a reference, and that no two share one
- [ ] 4.6 Failure paths: a payment day outside 1–31, a negative water reading, an unauthenticated request
- [ ] 4.7 Confirm the lease-detail screen still renders unchanged against the new response, in a visible browser — this change touches what that screen reads, so `curl` is not enough
- [ ] 4.8 Confirm the screen shows nothing for the terms it now receives as null, rather than a placeholder — the rule it already follows, now with real nulls arriving to test it
