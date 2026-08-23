## Why

The lease is the thing every other record hangs off — a bill is issued against one, a deposit is held by one, a room is occupied by one — and it is the only major record with no screen. An owner who wants to sign a tenancy today has to call the API by hand.

It is also the record most easily misread, and three of its rules are the kind a screen can quietly contradict:

- **A lease's occupant count is not the number of people recorded on it.** The count is what utility billing uses; the records are the people whose details the owner happens to hold. A lease may say five people live there while naming two, and both figures are correct. A screen that shows a list of two under a heading reading "5 occupants" looks broken, and one that shows only one of the numbers hides the one the reader needed.
- **A date that ends a tenancy is exclusive.** A lease ending 1 July covers through 30 June. Printing "ends 01/07/2026" beside a tenant who must be out on the 30th is how a wrong date gets acted on.
- **A lease whose term ran out with no move-out recorded needs attention**, and the API has a filter for exactly that reason: no further invoice can be issued for it, and its room stays held against a new tenancy. The API can find them; nothing shows them.

## What Changes

- A leases screen: every tenancy, newest first, filterable by room, by person, by whether it is still running, and by whether its term has run out unclosed.
- **Leases needing attention are visible without being filtered for.** A filter finds them only if the owner already suspects they exist.
- A lease detail screen: agreed terms, the room, the tenant, the deposit and the months it was agreed in, the dates the tenancy covers, and its occupants.
- Creating a lease, from two places: the leases screen, and a room that has no active lease. The same form either way — an owner thinks in rooms, a ledger thinks in tenancies, and both routes are how the work actually arrives.
- Editing the agreed duration and the occupant count of a running lease.
- Managing occupants: adding a person, recording that one left, and transferring who is responsible for the agreement.
- **Departing the responsible occupant offers the transfer it requires**, rather than reporting the refusal and leaving the owner to work out what to do.

Deliberately **not** in this change: extending a lease, recording a move-out, and returning a deposit. Each moves money, none can be undone, and each needs a screen showing what the figures will be *before* the owner commits — that is its own change rather than a dialog bolted onto this one.

## Capabilities

### New Capabilities

- `web-leases`: the owner's screens for seeing, creating, and maintaining tenancies, and for keeping the record of who lives in them.

### Modified Capabilities

- `room`: a room reports whether a tenancy is currently running in it, and rooms can be filtered to those with none.
- `lease`: a lease reports the room it is for, and leases are listed most recently begun first.
- `web-rooms`: a room with no active lease gains a way to start one, so signing a tenancy can begin from the room it is for.

## Impact

- `backend/src/modules/rooms/` — the room representation reports whether it is let, and the listing gains a vacancy filter. No schema change: the fact is already derivable, and the system already computes it in order to refuse retiring an occupied room.
- `backend/src/modules/leases/` — a lease reports its room, and the listing orders by start date descending.
- `frontend/src/features/leases/` — new.
- `frontend/src/features/rooms/` — vacancy shown, and an action where a room has none.
- `frontend/src/app/router.tsx` — `/leases` and `/leases/:id` replace the placeholder.

The backend changes were not expected when this was first drafted. Three gaps turned up while reading the API against what the screens need, and each is a shape problem rather than a presentation one:

- **A room does not say whether it is let.** Answering it in the browser means fetching every running tenancy and subtracting — a request whose cost grows with the number of tenancies, producing an answer already stale, and a helper every future caller has to be warned about.
- **A lease does not report its room**, only a room id. A list of twenty tenancies cannot be displayed without twenty further requests, or fetching every room and joining by hand. The precedent is in the codebase already: a room reports its building for exactly this reason.
- **Leases are listed oldest first.** The tenancy an owner has just signed lands on the last page. This cannot be corrected in the browser at all — a page is a page, and sorting the twenty rows in hand does not change which twenty they are.

We own both sides, so each gets an API-shaped fix.
