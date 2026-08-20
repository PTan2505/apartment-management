## Context

See proposal.md — Why. What constrains the approach:

- `Lease` already has a field resolved exactly this way: `startMeterReading` defaults from the room's history and may be overridden at creation. The rent has the same shape, so it should not invent a second pattern.
- `Lease` already derives values rather than storing them — expected end date, status, and tenant are all computed from the records they come from, and the spec says none may be independently set.
- `Invoice` already copies `baseRent` at issue time. That copy is what makes issued invoices immune to later edits, and it stays exactly as it is; only the source of the copy moves.
- Both new columns are `NOT NULL` and the table has rows, so the migration is add-nullable → backfill → set NOT NULL, the same three-step shape the `fullNameSearch` migration used for the same reason.

## Goals / Non-Goals

**Goals:**

- Make the agreement the authority on what a tenant pays.
- Record the deposit as it is actually agreed — in months, not in currency.

**Non-Goals:**

- Moving money. Charging the deposit and deciding its refund belong to the billing change; this one records terms.
- Changing rent on a running lease. Confirmed as unwanted.
- Touching issued invoices. They already carry their own copies.

## Decisions

### Derive the deposit amount; store only the months

`depositMonths` is stored, `depositAmount` is computed as `depositMonths × baseRent` and never written down.

Storing both would create two values that can disagree, and one of them would eventually be wrong: an amount stored at creation and a rent corrected a minute later would leave a deposit that matches neither the months agreed nor the rent agreed. The lease capability already resolves exactly this tension the same way for its end date, status, and tenant, and the spec states the principle — none of these may be independently settable.

Months is the honest unit besides. "Two months' deposit" is what is agreed in the room; the currency figure is a consequence of it.

**Alternatives considered:**

- *Store `depositAmount` directly, no months.* Rejected: it loses the agreement's own terms, and a rent correction leaves the deposit unexplainable — 6,000,000 against a rent of 3,200,000 is neither one month nor two.
- *Store both.* Rejected as above: two sources of truth for one fact.

### Default the rent from the room, allow an override

Identical in shape to `startMeterReading` on the same endpoint, and for the same reason: there is an obvious right answer nearly always, and a minority of cases where only the owner knows better. Forcing the rent to be supplied every time would make the common case tedious; refusing an override would force the owner to edit the room — changing what it asks of every future tenant — to record what one tenant negotiated.

The override is read at creation only. A lease's terms do not change afterwards.

### Backfill `depositMonths` to zero, and say why in the migration

Existing leases recorded no deposit. Zero is the only value that is not an invention: any other number would assert a deposit that was never agreed.

This is lossy in one direction — a lease that did take a deposit in reality will read as zero — and that is unavoidable, because the information was never captured. The migration says so rather than leaving a reader to assume the data is complete.

`baseRent` backfills from the lease's room, which is exactly what billing has been using for those leases all along. That backfill is not an approximation: it reproduces current behaviour for every existing lease.

### One-line source change in invoicing, with a spec-level consequence

Invoice generation changes from reading the room's rent to reading the lease's. The code change is trivial; what it means is not, which is why it is written into three capabilities' specs rather than left as an implementation detail.

The give-away that it matters: before this change, an owner could not answer "what does this tenant pay?" without knowing whether anyone had edited the room since. After it, the lease answers.

## Risks / Trade-offs

- **A lease created before this change reads as having no deposit.** → Unavoidable and stated in the migration; the alternative is inventing figures. There are no production leases today, so the exposure is theoretical rather than actual — worth confirming before the migration runs rather than assuming.

- **`depositMonths` is required, which is a stricter contract than before.** A caller omitting it now gets a 400. → Deliberate: a silently-defaulted zero would make "no deposit" and "forgot to record the deposit" the same value, which is the exact ambiguity the spec forbids. No frontend calls this endpoint yet, so nothing breaks in practice.

- **Two rents now exist and could be confused** — the room's asking rent and the lease's agreed rent. → Named distinctly in the specs and the reason for each stated in the room capability, which is where someone reading about room rent will be.
