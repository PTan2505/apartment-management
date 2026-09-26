## Context

See proposal.md — Why. The mechanics that matter here:

- `requireRole(...)` is already mounted per route, so narrowing a route is a one-word
  edit. Three of the four instructions are exactly that.
- The fourth is not. "A manager may not set a price" is a rule about FIELDS of a request,
  not about a route: the same `POST /leases` must succeed for a manager and succeed
  differently for an owner. No existing middleware expresses that.
- `api-staff-roles` is complete but NOT archived, so `openspec/specs/staff/spec.md` does
  not exist yet. This change's `staff` delta is written against that change's delta.

## Goals / Non-Goals

**Goals**

- One place per rule. A reader asking "what may a manager not do?" should find the answer
  in the router beside the route, not by tracing a service.
- A refusal that names what was refused. `ROLE_NOT_PERMITTED` on a route is enough when
  the route is the whole answer; it is not enough when four fields of twelve are the
  answer.
- The deposit default must be a number the owner stated, not a constant compiled in.

**Non-Goals**

- A general permission system. Four rules do not justify one, and a table of
  role×resource×verb would be harder to read than the routers it replaced.
- Field-level permissions as a framework. Exactly two request bodies need this.
- Reshaping the `room`, `invoice` and `payment` specs to talk about roles. They still say
  "authenticated owner"; the `staff` capability is where roles are reconciled, and
  duplicating the map into five specs is how the two copies start to disagree.

## Decisions

### Route rules stay in the router, as `requireRole("owner")`

Rooms lose `manager` on create/update/retire/restore; `PATCH /leases/:id`,
`POST /invoices/:id/pay`, `POST /invoices/:id/void` and `POST /payments/:id/reverse` lose
it outright. The rooms router currently applies one `requireRole("owner", "manager")` to
the whole router, so it needs splitting per route the way the buildings router already is
— and the buildings router is the model to copy, comment included.

Alternative considered: checking the role inside each service. Rejected — the service
would need the role threaded in beside the scope, and a service that refuses on a role is
a service that cannot be called by the scripts that backfill data.

### Field rules live in the lease schema, as a role-aware parse

`createLeaseSchema` and `extendLeaseSchema` gain a sibling that takes the caller's role.
For an owner it is today's schema. For a manager, the four money fields are refused with
HTTP 403 and a new code `LEASE_TERMS_OWNER_ONLY`, whose message NAMES the fields
supplied.

Refuse rather than strip. Zod's `.omit()` would be one line and would create the tenancy
at the room's rent while the manager believes it carries theirs — the tenant is then
billed an amount nobody agreed, and nothing anywhere records that a different figure was
asked for. A 403 that says "base rent and deposit months are the owner's to set" costs
the manager one round trip and cannot mislead.

Alternative considered: a generic `refuseFields(role, fields)` middleware. Rejected for
two callers; it would have to re-parse the body to know which fields were present.

### The deposit default hangs on the building, not the room

Rent belongs to the room because rooms differ. A deposit policy is how the landlord does
business — "we take one month" — and lives with the electricity and water rates the
building already carries. Putting it on the room would mean setting it sixty times.

`Building.defaultDepositMonths Int @default(1)`. The default in the DATABASE is what
backfills the existing rows; one month is the common arrangement here, and the owner can
correct any building on the screen it is already editable from. A nullable column was
considered and rejected: every read would then have to decide what null means, and the
answer would be a constant compiled in — the thing this decision exists to avoid.

`depositMonths` on `POST /leases` becomes optional. Its current required-ness was a
deliberate choice, recorded in the schema, that "no deposit" and "forgot to say" must not
collapse into each other. That reasoning survives: omitting now resolves to a number the
owner STATED on the building, not to zero. The comment in `schema.ts` that argues for the
old behaviour has to be rewritten rather than left to contradict the code.

### Reading stays exactly as wide as it is

None of this narrows what a manager can SEE. They keep base rents, rates, invoice totals
and amounts owed — a manager who cannot record a payment still has to chase one, and a
manager who cannot set a rent still has to quote it.

## Risks / Trade-offs

- **The screens are unchanged by this change, so a manager sees buttons that now answer
  403.** → `web-manager-limits` is the other half and the two ship together. Until it
  does, the failure is a red toast rather than a wrong record, which is the right way
  round.
- **"Không ghi nhận hoá đơn đã thanh toán" moves money collection to one person.** A
  tenant who pays in cash now waits for the owner to record it. → The tenant's payment
  link is untouched and records itself. Worth telling the owner plainly; if cash is
  common, a manager-recorded payment awaiting the owner's confirmation is the change to
  propose next, and it is a bigger one than this.
- **The role description shown when creating a staff account says the manager "thu
  tiền".** That is now wrong. → New wording is proposed in tasks, for the owner to
  approve before it is written — Vietnamese strings are not changed unilaterally.
- **Deposit months default to 1 for every existing building.** → Only affects tenancies
  signed AFTER this ships, and only when the deposit is omitted; every existing tenancy
  keeps what it recorded. The owner should still be pointed at the building screen once.
- **Archive order matters.** `api-staff-roles` must be archived before this change, or the
  `staff` delta has no main spec to modify. → Named here and in tasks.

## Open Questions

None. Three were put to the owner before this was written — the occupant count, the
deposit, and whether withdrawing an invoice and reversing a payment are also the owner's
— and all three are answered in the specs above.
