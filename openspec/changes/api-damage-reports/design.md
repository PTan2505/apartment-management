## Context

The portal is a public router authorised by a per-tenancy token. Photographs
already have a path in this system: presigned R2 uploads, used for contracts and
ID cards.

## Goals / Non-Goals

- Goal: one row per thing that broke, from the tenant's words to the work being
  done.
- Non-Goal: a work-order system — cost, parts, assignment to a named worker.
  Those are guesses about a business that has never run one of these.
- Non-Goal: notifications. Nothing in this system sends anything yet, and
  inventing a channel here would be the whole feature over again.

## Decisions

### The report belongs to the TENANCY, not the room

The token names a tenancy, so the tenancy is what a report can be attributed to
without being told. It carries the room and building for staff, and stays
attached to the tenancy that raised it after a move-out — which is what makes it
evidence in a deposit settlement rather than an anonymous note about a room.

### Three states, no reopening

`new → scheduled → done`, with `new → done` allowed. A closed report stays
closed because the second occurrence is a second report: two rows say "this
broke twice", one edited row says nothing.

### Photographs reuse the presigned upload path

Same three steps as a contract page — sign, browser PUT, confirm — under a
report-scoped key prefix. Optional: a tenant photographing a leak on a phone is
the common case, and a tenant who cannot is not blocked from reporting.

### Ordering is oldest open first

The opposite of every other listing in this system, deliberately. Elsewhere the
newest row is the interesting one; here the oldest OPEN one is, because it is
the one that has been waiting.

## Risks / Trade-offs

- **A tenant can raise many reports.** No rate limit — the portal has none
  anywhere, and the mitigation for noise is that staff can close them.
- **No notification.** Staff find new reports by opening the screen. Stated in
  the proposal rather than hidden: without it, "sees a new report" means
  "looks".
