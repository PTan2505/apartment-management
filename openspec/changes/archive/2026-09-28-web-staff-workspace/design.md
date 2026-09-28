## Context

`AppShell` renders a fixed destination list; `ProtectedRoute` asks only whether
there is a session; every screen assumes the owner's scope. `/auth/me` already
reports the signed-in account.

## Goals / Non-Goals

- Goal: a role sees a coherent application, not the owner's one with holes.
- Goal: a narrowed list is legible as narrowed.
- Non-Goal: separate applications per role. One bundle, one shell; roles differ
  by destinations and by what the API returns.
- Non-Goal: rebuilding the existing screens. A manager uses the same tenancy
  list the owner does — it is the data that is narrowed, not the screen.

## Decisions

### Destinations carry their roles

The navigation list gains `roles` per entry, and the shell filters by the
signed-in role. One list, read in one place, rather than a condition per link.

### The starting screen belongs to the role

`DEFAULT_PATH` becomes a function of role. Sending maintenance to the buildings
screen — which will refuse it — would make the first thing the application does
be an error.

### Scope is stated, not implied

The shell names the buildings a staff account covers. Without it, "three
tenancies" is indistinguishable from "the rest failed to load", and the person
holding the screen has no way to tell.

### The report screen is shared by both staff roles

The owner's instruction was that either may contact the tenant. One screen, and
what differs is only which reports the API returns.

## Risks / Trade-offs

- **Two more roles to check on every screen.** Kept to one place — the
  destinations list and the route guard — rather than scattered conditions.
- **A maintenance account has one screen.** Deliberately: everything else is
  refused by the API, and a navigation full of refusals is not a workspace.
