## Context

See proposal.md — Why. What shapes the approach, all checked rather than assumed:

- `InvoiceType` holds four kinds, three of them guarded by partial unique indexes at one per lease. A fifth needs no such index and must not get one.
- `InvoiceLineKind` holds five kinds. The revenue report excludes exactly one of them, `deposit`, and does so **by kind rather than by sign** — a fact the previous change verified when it introduced negative deposit lines.
- `InvoiceLineItem` already carries a nullable `buildingServiceFeeId` for provenance, a description written for a reader, and a nullable period.
- The overdue invoice is already an owner-priced bill, but its charges are chosen from the building's service fee catalogue and it is one per lease.
- `deposit_deduction` already exists as a payment method, already refuses to spend more than a lease holds, and already moves the holding inside the payment's transaction.
- `Lease` carries `depositRefunded`, `depositRefundedAt` and `depositNote`. The note exists only to explain an amount that this change removes.
- `ExpenseCategory` is a fixed enum with a free-text description beside it — the exact shape this change needs on the income side.
- The revenue report already reports `expensesByCategory` per building and in total.

## Goals / Non-Goals

**Goals:**

- Give the owner one way to charge for anything the system cannot calculate.
- Make money kept from a deposit impossible to record without saying what it was for.
- Let an owner compare what they charged for damage against what the repair cost.

**Non-Goals:**

- Folding the overdue invoice into this. Same shape, arguably a special case, but it works and is verified; merging would move money for no gain.
- Charging anything that is not a lease. A building or an empty room has no tenant to bill.
- Editing a charge after issue. Invoices are voided and reissued, as they already are.
- Partial payment. Unchanged, and out of scope as everywhere else.

## Decisions

### A fixed category enum, not the service fee catalogue and not free text

Ad-hoc charges get `damage | cleaning | lost_item | penalty | other`, with a free description beside them.

The overdue invoice's precedent argues for the catalogue: it makes the owner pick from the building's service fees so a name stays comparable. That reasoning does not carry here. A service fee is a thing the building *offers*, recurring monthly; a broken window is not, and putting it in the catalogue would let a lease subscribe to one. The catalogue would fill with entries nobody can ever select as a service.

Free text was the other alternative, rejected for what it costs the report: "broken window", "vỡ kính" and "Hong cua kinh" are three categories, and the comparison against repair expenses becomes impossible.

The enum mirrors `ExpenseCategory` deliberately, and the mirror is the point. `damage` charged is what `repair` costs.

### The category lives on the line, not on the invoice

One invoice may carry a damage charge and a cleaning charge. Categorising the invoice would force the owner to issue two, or to mis-file one.

This makes the category a sixth nullable column on `InvoiceLineItem`, null for every other kind of line. That is the same shape `buildingServiceFeeId` already has, and it is preferred over a separate table for the same reason: a line's provenance belongs on the line.

### The charge is a new line kind, not a `serviceFee` line

`InvoiceLineKind` gains `charge`.

Reusing `serviceFee` was tempting — it is already the "some named thing costs money" kind — and is wrong. A service fee points at a catalogue entry and recurs; a charge points at an event and does not. Any report grouping by fee would find charges among the parking spaces.

The new kind counts as revenue, which needs saying explicitly only because `deposit` is the one kind that does not, and someone adding the sixth kind will wonder which side of that line it falls on.

### Returning a deposit loses its amount, and its note

`POST /leases/:id/deposit-refund` takes no amount. The holding is what goes back.

This is a breaking change to an endpoint that shipped days ago, and it is the reason the change exists rather than a consequence of it. Leaving the amount in place would mean two routes to keeping money — one that records a category and a figure, one that records a sentence and loses the money — and the wrong one is the easier one.

The `depositNote` column goes with it. A reason for keeping money now lives on the charge that took it, where it has an amount and a category. Keeping the column would leave a second, weaker place to write the same fact.

`depositRefunded` stays, now always equal to what was held at the moment of return. Storing it rather than recomputing keeps the return a dated, immutable record of what actually happened.

**A return of zero is valid**, where a departing tenancy's deposit was entirely spent on what it owed. It records that the deposit was settled, which is a different fact from a deposit nobody has dealt with yet.

### Categories are reported as a breakdown of `billed`, not beside it

The report gains `chargesByCategory`, computed from the same line items it already reads, and adding nothing to `billed`.

The alternative — a separate total for ad-hoc income — was rejected because it invites double counting by anyone summing the report's top-level figures. A breakdown that partitions an existing figure cannot be added to it by mistake.

## Risks / Trade-offs

- **Breaking an endpoint that shipped this week.** → Nothing calls it: no frontend exists, and the only caller so far was the previous change's own verification. Named in the proposal rather than buried here, because "we changed it because it was new" is exactly the reasoning that goes unrecorded and then gets repeated when it is no longer safe.

- **A free amount on a free description is easy to misuse.** An owner can put a month's rent on an ad-hoc invoice and call it `other`. → Accepted. The system already trusts the owner with the overdue invoice's amounts, and the category breakdown makes misuse visible in the report rather than invisible.

- **`other` will absorb everything.** A category people reach for when they cannot be bothered. → Accepted for v1, and observable: if `other` dominates the breakdown, that is the signal the enum needs another value, which is a cheap change.

- **Two owner-priced invoice kinds now exist**, overdue and ad-hoc, with different naming mechanisms — one from the catalogue, one from an enum. → A real inconsistency, deliberately left. Unifying them means changing how overdue charges are named, which moves money on a path that is currently verified and correct.

- **The revenue report changes what it counts.** → Its identity `billed = collected + outstanding` is the check, and it must hold with an ad-hoc invoice in range, paid and unpaid, including one settled from a deposit. Verified directly rather than reasoned about.

## Migration Plan

1. Add the enum values (`InvoiceType.adhoc`, `InvoiceLineKind.charge`) via `ALTER TYPE ... ADD VALUE`, and the nullable category column. No existing row changes meaning.
2. Drop `Lease.depositNote`. It is populated only where a previous return recorded a reason; those rows are read out and reported before the column goes, as a task rather than an assumption.
3. Rollback is dropping the column and the endpoint; the enum values are additive and harmless if unused.
