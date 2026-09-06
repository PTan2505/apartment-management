## Context

See proposal.md — Why.

`Lease` today carries what billing needs: `baseRent`, `depositMonths`, `startDate`, `durationMonths`, `occupantCount`, `startMeterReading`, and the dates that end a tenancy. Everything else about the agreement lives on paper.

The constraint that shapes this whole change is that **every existing lease predates these columns**. Nine tenancies in the local database, and however many in production, have no notice period and never will retroactively.

## Goals / Non-Goals

Recording five terms and reporting them honestly when they are absent. Not: invoice due dates, receipt numbers, bank reconciliation, a reminder action, or signature verification — each named in the proposal with its reason.

## Decisions

### Every new column is nullable, and null means "not agreed", not "zero"

The alternative is a `NOT NULL DEFAULT`, and it is the wrong one for exactly the reason this change is being written down: it would state a term for tenancies whose agreements say something else, or say nothing. Thirty days is the common notice period; it is not the notice period of a tenancy nobody asked.

This is the same rule the lease-detail screen already follows — it omits a field the record does not hold rather than showing a placeholder — so the API and the screen agree about what absence means.

**The water reading makes this concrete.** Zero is a legitimate meter reading. A `NOT NULL DEFAULT 0` makes "no reading recorded" and "the meter read zero" the same value, and the difference between them is the whole substance of a water dispute. Nullable, and the spec says the two are reported differently.

### The reference is generated, not typed

An owner-typed reference drifts: two leases get the same one, a typo makes one unfindable, and the field becomes a place people write notes. Generated from facts the lease already has — the room and the year it began, plus a discriminator — it is stable, unique and says something.

Existing leases get one at migration time, since a reference derived from existing data is not an invented TERM: it names an agreement that exists rather than asserting something about what it says. That is the one place this change back-fills, and the distinction is deliberate.

### `handoverSignedAt`, a timestamp, not a boolean

"Whether handover was signed" is a boolean question, but the useful record is when. A timestamp answers both, and a boolean that later needs a date is a migration; the reverse never is.

### Correcting one term must not require the others

The update path validates the whole terms object today. With five nullable additions, the obvious implementation makes an owner fixing a rent supply a notice period that was never agreed — turning missing history into an obstacle, which is the failure mode this design exists to avoid. Absent stays absent unless the caller says otherwise, and the spec has a scenario for it.

## Risks / Trade-offs

- **Five nullable columns is a lot of optionality**, and optional fields are the ones that never get filled in. → They are reported and shown, which is the pressure that gets them filled for new tenancies. Old ones stay honestly empty.
- **A generated reference could collide** where two leases share a room and a year — a renewal chain does exactly that. → The discriminator has to make it unique, and uniqueness has to be enforced by the database rather than by the generator, since a generator is what races with itself.
- **Payment day interacts with billing**, which currently assumes nothing about which day rent is due. → This change RECORDS it and does not act on it. Making the biller honour it is a separate change with real consequences for proration, and conflating the two would hide a billing change inside a field addition.

## Migration Plan

One migration adding five nullable columns, plus a back-fill of the reference for existing rows. Reverting means dropping the columns; nothing else reads them until a frontend change does.

## Open Questions

- The exact shape of the generated reference. It does not change the schema, the spec or the task breakdown, and settling it needs a look at how the owner refers to agreements today — a question for the apply pass, not a blocker.
