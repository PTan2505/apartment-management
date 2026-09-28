## Context

`Role` is `owner | customer`. Every domain router begins
`requireRole("owner")`, and no listing takes the caller into account: the `where`
clause of a listing is built from query parameters alone.

## Goals / Non-Goals

- Goal: two more roles, each seeing only its buildings, with one place that
  decides what "its buildings" means.
- Goal: a generated first password that the system never shows twice.
- Non-Goal: per-endpoint permissions configured at runtime. Roles are fixed in
  code; a table of permissions is a second system to get wrong.
- Non-Goal: changing what the owner can do. Nothing the owner reaches today
  moves or narrows.

## Decisions

### Scope is a `where` fragment, resolved once per request

A middleware resolves the caller's building ids and puts them on the request.
Each module's listing adds `buildingId: { in: ids }` — through its room for
tenancies and invoices, directly for expenses and service fees — and each
single-record read asserts membership, answering 404 rather than 403 when it
fails.

Answering 404 is deliberate: 403 confirms the record exists, which is how an id
becomes a way to count another building's tenancies.

The alternative — a global query filter in Prisma — was rejected because the
join differs per model and a silent filter is a filter nobody can see when
reading the code that depends on it.

### `requireRole` gains a list, and a second guard states the exception

`requireRole("owner", "manager")` reads as what it is. Endpoints the owner keeps
to themselves stay `requireRole("owner")`, so the exception is visible at the
route rather than derived from an absence.

### The password change is enforced by the API, not the screen

A `mustChangePassword` flag on the user, checked by the same middleware that
authenticates. Enforced server-side because a client-side redirect is a request
away from being skipped, and the account it protects is one whose password was
read aloud over the phone.

Four endpoints stay open to such an account: `/auth/login`, `/auth/me`,
`/auth/password`, `/auth/logout`. Anything else answers 403 with
`PASSWORD_CHANGE_REQUIRED`.

### The generated password is returned, never stored in the clear

Random, human-readable enough to be dictated over the phone once (no ambiguous
characters), hashed with bcrypt like every other password. The response that
creates the account is the only place it ever appears.

### Assignment is its own table

`StaffBuilding(userId, buildingId)`, unique together. Many-to-many was chosen by
the owner: one maintenance worker covers several buildings, one building has
several managers.

## Risks / Trade-offs

- **Every listing must be narrowed, and a missed one leaks.** Mitigated by
  having one resolved value rather than per-module logic, and by a browser check
  that signs in AS a manager and reads the other building's ids back.
- **A manager can sign tenancies and record money.** That is the owner's
  decision; the boundary is what the business EARNS and what it CHARGES, which
  stays with the owner.
- **`customer` remains a role with no login.** Unchanged here; the portal is
  still a token.
