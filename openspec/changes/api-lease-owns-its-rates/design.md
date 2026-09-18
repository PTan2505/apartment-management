## Context

- `Lease.baseRent` is `Decimal(12, 2)`, copied from `Room.baseRent` at creation with a comment saying the precision matches so the copy cannot lose digits. Rent is billed from the lease.
- Electricity and water are billed from `lease.room.building.*`, read at calculation time in three places: `invoices/issue.ts` (move-in and monthly), `invoices/service.ts` (the preview and the monthly generate), and `billing.ts`, which takes them as inputs.
- `Building.electricityRate` is `Decimal(10, 2)`; `waterRatePerPerson` is `Decimal(12, 2)`.
- Vacancy electricity (`expenses/service.ts`, and the lease-start vacancy cost in `leases/service.ts`) also reads the building rate. No tenancy is involved in either.
- Nothing records rate history: a building holds one pair of figures, and changing them leaves no trace of what they were.

## Goals / Non-Goals

**Goals.** A tenancy is billed at what it was signed at. Editing a building affects what is signed next, and nothing already signed. Existing tenancies keep billing exactly as they do today.

**Non-Goals.** Rate history on the building. A way to re-price a running tenancy (see Risks). Changing how vacancy electricity is costed. Any change to invoices already issued — their line items already record the rates applied.

## Decisions

### Copy onto the tenancy, exactly as rent already is

`Lease` gains `electricityRate Decimal(10, 2)` and `waterRatePerPerson Decimal(12, 2)` — the same precision each building column holds, so the copy is exact. `createLease` fills them from the room's building inside the transaction it already runs.

An alternative was a rate-history table on the building, billing by looking up the rate in force on the invoice's period. It answers more questions, and it is the wrong size for this system: it adds a table, a temporal lookup to every bill, and a way for two sources to disagree, to solve a problem that copying already solves for rent.

### Backfill with the building's current rates

The migration writes each building's current rates onto its existing tenancies. Those are the figures the next invoice for those tenancies would have used anyway, so no tenancy changes what it bills.

This cannot reconstruct what a tenancy was ACTUALLY signed at, because that was never recorded. The migration says so in a comment rather than implying the backfilled figures are history.

### `billing.ts` keeps its shape; its callers change

`computeCharges` already takes the rates as inputs rather than reading them. The three callers stop passing `lease.room.building.*` and pass `lease.*`. The building's rates are then read in exactly two remaining places, both about an empty room.

### Vacancy electricity stays on the building

A room standing empty has no tenancy and no agreement. The meter still runs and the owner still pays, at whatever the building charges now. Left alone deliberately, and stated in the invoice spec so the asymmetry is visible rather than looking like an oversight.

### The form states the consequence where the consequence is

One line under the rate fields, shown only when editing: "Giá mới chỉ áp dụng cho hợp đồng ký từ nay về sau và hoá đơn của những hợp đồng đó. Hợp đồng đã ký giữ nguyên giá cũ." Creating a building has nothing already signed, so the line would be noise.

## Risks / Trade-offs

**A running tenancy cannot be re-priced.** Raising a building's rates does not reach its tenants, and there is currently no screen that changes a tenancy's own rates — `EditTermsDialog` does not offer them. That is the behaviour asked for, and the gap it leaves is worth naming: the owner's route today is a renewal, which signs a new tenancy at the new figures. Offering the rates on the terms dialog is a candidate follow-up, not part of this change.

**The backfill is not history.** Any tenancy signed before this change is recorded as having been signed at today's rates. Where a building's rates were edited in the past, that is wrong about the past — but it is exactly what the system was already billing, so no bill changes.
