## Context

See proposal.md — Why. Three facts shaped it:

- Water is ALREADY charged per person, as `waterRatePerPerson × lease.occupantCount`
  read when the invoice is generated. A per-person service fee that worked any other way
  would sit next to it on the same bill, charged on a different head count.
- `LeaseServiceFee` copies `unitAmount` at selection so repricing cannot disturb an
  agreement. Any second thing that decides the amount has to be copied the same way, or
  the rule only half holds.
- Nothing about the fee arithmetic is reachable except through `computeServiceFeeCharges`,
  which already takes a per-fee record. The change is what fills one field of it.

## Goals / Non-Goals

**Goals**

- A per-person fee cannot drift from the water charged beside it.
- A fee every room pays is set once, not fifty-eight times.
- Existing data means exactly what it means today, with no migration of behaviour.

**Non-Goals**

- Applying a default fee to tenancies that already exist. Explicitly refused: it would
  charge a tenant for something never agreed with them.
- A third basis (per square metre, per month of tenancy, banded). Two answers cover what
  was asked; a general expression language does not.
- Changing how the head count itself is recorded. `occupantCount` is a term of the
  tenancy and is edited where it already is.
- Overdue charging, still.

## Decisions

### `perPerson` reads the head count at billing, and stores nothing

The alternative — snapshot the count into `quantity` at selection — was put to the owner
and rejected. It makes "per person" a label: somebody moves in, nobody edits the fee, and
the charge is quietly short for the rest of the tenancy. Reading it at billing is also
what water does, so the two figures on one bill cannot disagree.

Consequence to accept: generating an old month LATE charges that month's fee at TODAY's
head count. Water already behaves this way, and matching it is better than being right
differently in one row of the same invoice.

`quantity` is left at 1 and ignored for such a fee, and the API refuses a quantity on
one — silently ignoring it would let a caller believe they had set something.

### The basis is copied onto the selection, like the price

One column on `LeaseServiceFee`. Without it, flipping a catalogue fee to per-person
would change what running tenancies are billed, which is the exact thing the copied
price exists to prevent.

### Default fees attach at lease creation, inside its transaction

Lease creation already writes the lease, its primary occupant and its move-in invoice
together. The default fees join that transaction: a tenancy missing a charge every other
room pays is invisible until somebody compares two bills, so it must not be a partial
success.

### Two booleans, not a rules engine

`basis` as an enum and `appliedByDefault` as a flag, both on `BuildingServiceFee`, both
defaulting to today's behaviour. The column defaults do the backfill; no data migration
script is needed.

## Risks / Trade-offs

- **Late billing of an old month uses today's head count for per-person fees.** →
  Accepted and stated above; it is water's existing behaviour, and consistency within one
  invoice matters more than being differently right in one line.
- **An owner marks a fee default expecting every current tenant to be charged.** → The
  form says plainly that tenancies already signed are not affected. Worth watching: if
  the owner wants it applied to running tenancies, that is a bulk action with its own
  confirmation, and its own change.
- **`perPerson` × a tenancy whose occupant count is 1 looks identical to `perRoom`.** →
  Only until somebody moves in, which is the case the feature exists for. The row states
  its basis so the two are told apart before that happens.
- **Order matters**: this ships after `web-service-fees`, which built the screens these
  two options live on.
