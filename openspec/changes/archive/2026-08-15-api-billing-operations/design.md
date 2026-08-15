## Context

`Building` carries `electricityRate` and `waterRatePerPerson`, `Room` carries `baseRent`, and `Lease` carries `occupantCount` — all as `Decimal`/`Int` columns chosen precisely so billing could multiply them without float drift. The building and room specs already state that changing a rate must not alter an issued invoice, so snapshotting is an inherited obligation. Pagination, soft delete, `requireRole("owner")`, and the partial-unique-index pattern are all established. See proposal.md for motivation.

Decisions locked before this design (from prior exploration, not reopened here): one invoice per lease per month; electricity from metered consumption, never prorated; rent and water prorated by days; every input snapshotted; amounts rounded to whole units; void and reissue rather than edit; payment date stored; each lease carries its own starting meter reading, defaulted from the previous tenancy but overridable.

## Goals / Non-Goals

**Goals:**
- Make an issued invoice a faithful, immutable record of what was charged and why.
- Make electricity attribution correct across tenancy changes without cross-lease queries at billing time.
- Make re-running billing safe, so a duplicated request cannot double-charge a tenant.

**Non-Goals:**
- No owner-paid expenses. Cleaning, repairs, and the electricity consumed during a vacancy belong to `api-expenses`, which will generate the vacancy cost from the meter gap this change makes visible.
- No revenue aggregation — `api-revenue-reports`.
- No batch billing endpoint. Each room needs its own meter reading typed in, so a batch call mostly buys partial-failure complexity; the client loops over single generations.
- No automatic invoice generation on a schedule. Billing is an explicit act by the owner.
- No proration of a mid-month occupant-count change. The count is snapshotted once at billing time, consistent with the existing lease requirement that occupant count is maintained separately from occupant records.

## Decisions

**Each lease stores its own opening meter reading**: `Lease.startMeterReading` is captured at creation and `Lease.endMeterReading` at move-out. This is the pivotal decision, because it removes the need to resolve "the room's latest reading" at billing time. A lease's first invoice opens from its own `startMeterReading`; every later invoice opens from that lease's previous invoice. There is never a query across leases, so generating invoices out of order cannot change anyone's bill.

Alternative considered: deriving the opening reading from the room's most recent invoice across all leases. Rejected for two reasons. It silently charges an incoming tenant for electricity used while the room stood empty — the meter advances during cleaning and repairs, and that cost belongs to the owner. And it creates an ordering window: between a move-out and the generation of that tenancy's final invoice, the room's "latest invoice" is stale, so a new lease billed first would open from the wrong reading.

**A replaced meter stops being a special case**: because the owner types the opening reading when a lease starts, a meter swapped between tenancies is just a lower starting number. No flag, no override path. Only a meter replaced *mid-lease* remains unhandled, and that is rejected with a 400 — it is genuinely rare, and inventing a mechanism for it now would be speculative.

**Idempotency is keyed on lease, not room**: a partial unique index on `(leaseId, year, month) WHERE voidedAt IS NULL`, following the pattern used three times already. Keying on room would make mid-month turnover impossible to bill — two tenancies occupied the room that month and each owes for its own days. The partial predicate is what lets a voided invoice be replaced: the void frees the slot without deleting the record.

**Proration applies to flat charges only**: rent and water are monthly amounts, so occupying half the month means half the charge. Electricity is metered and already measures exactly what was used; scaling it by days would discount a measured quantity a second time. Concretely, `factor = daysOccupied / daysInMonth`, using the month's real length and counting both the first and last day of occupancy. Alternative considered: a fixed 30-day divisor, which is common in some lease accounting. Rejected because it makes February over-charge and 31-day months under-charge relative to the days actually lived, which is hard to explain to a tenant reading their bill.

**Each charge is rounded, and the total is their sum**: rounding once per component and adding produces an invoice whose line items visibly add up. Computing an unrounded total and rounding at the end would produce bills where rent + electricity + water does not equal the stated total by one unit — the kind of discrepancy that erodes trust in a financial document. Amounts are whole currency units, matching a currency with no minor unit in practice.

**Voiding rather than editing**: an issued invoice is a record of what was charged. Mutating it destroys the trail, and a corrected figure is indistinguishable from an original one. `voidedAt` marks an invoice inert: excluded from totals, excluded from the uniqueness predicate so a replacement can be issued, and retained so the correction is visible. Alternative considered: allowing edits with an audit log — rejected as more machinery than a small system needs when void-and-reissue achieves the same outcome.

**Payment date is separate from billed month**: `paidAt` alongside `year`/`month`. A March invoice paid in May is March's billing and May's cash. Revenue reporting will need both — billed for comparability across months, collected for what actually arrived — and a `status: paid` flag alone cannot reconstruct when payment happened. Capturing it now costs nothing; retrofitting it is impossible.

**Payment method is null until paid**: rather than defaulting to cash, so a pending invoice cannot be mistaken for a cash payment that was never recorded.

**Billing does not require an active lease**: a lease finalized on the 15th still owes for those 15 days. Invoice generation therefore validates that the requested month overlaps the lease's occupancy period, rather than checking that the lease is active. This is the one place the "one active lease per room" invariant deliberately does not apply.

## Risks / Trade-offs

- [An owner who mistypes the opening reading when creating a lease mis-bills that tenant's whole tenancy] → the reading is echoed on the created lease and on every invoice that derives from it, so the error is visible rather than hidden; the void-and-reissue path allows correcting invoices already issued.
- [Proration by days is an approximation when a tenant occupies a room unevenly] → unavoidable for a flat monthly charge, and the metered component — the part that actually varies with use — is not approximated at all.
- [Void-and-reissue leaves voided rows accumulating] → intentional: they are the audit trail. They are excluded from totals and from the uniqueness predicate, so they cost only storage.
- [Two required fields added to lease creation and move-out break existing callers] → no frontend consumes these yet, and both are captured as MODIFIED spec deltas so the change is explicit rather than discovered.
- [Rounding each component means the total can differ by a unit or two from an unrounded calculation] → accepted deliberately in exchange for line items that add up, which matters more on a document a tenant reads.

## Migration Plan

Adds an `Invoice` table with its partial unique index, and adds `startMeterReading` and `endMeterReading` to `Lease`. `startMeterReading` is required going forward, so on a database with existing leases it would need a backfill — but only the seeded owner exists and no leases do, so the column can be added directly. `endMeterReading` is nullable by nature, since it is only set at move-out. Deploy: `prisma migrate deploy`, then restart. Rollback: revert the migration together with the lease and invoice code, since the lease module would otherwise write columns that no longer exist.
