## Context

See proposal.md — Why. The shape that mattered:

- `BuildingServiceFee` is the building's catalogue; `LeaseServiceFee` is one tenancy's
  selection, and it COPIES the price at the moment it is taken up. Monthly billing reads
  the selections whose period covers the month and adds a line per fee, prorated by days
  where one started or stopped partway through. All of that already worked.
- Two screens were missing, and only both together produce a charge.

## Goals / Non-Goals

**Goals**

- Every endpoint that exists is reachable from a screen.
- The reader can tell "on offer" from "being charged", which is the one thing about this
  model that is easy to get wrong.
- Nothing about billing changes.

**Non-Goals**

- Overdue charging. It borrows a name from this catalogue and is otherwise unrelated: a
  lump sum typed at move-out, with no quantity and no price. Left exactly as it was.
- Charging per person rather than per room. Raised while this was being built; it is a
  schema change and belongs in its own proposal.
- Deleting a fee. Retiring exists because a month already lived through still has to be
  billable, and a delete button would promise something the model refuses.

## Decisions

### The catalogue moved to `features/buildings`

It is the owner's setting on a building. It lived under `features/leases` because the
move-out dialog happened to be the first screen that read it, and staying there while
gaining five operations and a management screen would have made "where does this live"
unanswerable. Three importers were re-pointed; the move-out dialog is unchanged in
behaviour.

### Two screens, each naming the other

The split — offer here, charge there — is the part an owner will get wrong. Rather than
collapsing it, each screen says what the other does: the building's card says a fee here
charges nobody until a tenancy takes it up, and the tenancy's dialog says that from now
on closing a month will include it.

### Quantity is asked on the tenancy, not the building

How many parking spaces this tenant took is a fact about the tenancy. The catalogue
holds one price for one unit, which is what the model stores.

### Repricing is explained rather than prevented

A tenancy holds its own copy, so changing the catalogue price cannot disturb an existing
agreement. That is the safe behaviour and also the surprising one, so the edit dialog
says it in the helper text rather than leaving the owner to discover it.

### A retired fee is still shown on a tenancy that holds it

With a note. The alternative — hiding it — would remove a charge from the screen that is
still on the invoice.

## Risks / Trade-offs

- **Two places to look before a fee bills anything.** → Unavoidable; the model is
  genuinely two-level. Mitigated by each screen naming the other, and by the tenancy card
  stating the monthly total so "nothing is being charged" is visible at a glance.
- **Quantity is saved on blur, with no explicit save.** → It is one integer with an
  immediate visible consequence, and a refusal is surfaced on the card. A dialog for one
  number would cost more than it protects.
- **`PATCH`/retire/restore on a fee ignore the building id in the path**, so a fee could
  be edited through another building's URL. Owner-only, and no screen builds such a URL,
  so it is not a privilege hole — but it is loose. Noted, not fixed here.
