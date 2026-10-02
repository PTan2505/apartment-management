## Context

See proposal.md — Why. Three existing pieces decide most of this:

- The portal is the only PUBLIC router in the system, authorised by a token that names a
  tenancy. It already lets a tenant pay a bill and report a fault without stating where
  they live.
- Identity photographs already exist on `User` as two keys, with a project rule that the
  images are never opened during development — only presence, type and size are checked.
- `LeaseOccupant` (who lives there) and `Lease.occupantCount` (what water is charged on)
  are deliberately separate, with a comment saying the two may differ.

That last one is the hinge. This feature records a third population, and the whole design
rests on keeping it out of the billing one.

```
  Người đứng tên ─── LeaseOccupant.isPrimary ─── signs, is responsible
  Người ở ────────── LeaseOccupant ───────────── listed, NOT billed
  occupantCount ──── a number on the Lease ───── what water is charged on
  Khách ghé ──────── LeaseVisitor (new) ──────── logged, NOT billed, flagged if long
```

## Goals / Non-Goals

**Goals**

- The owner can answer "who is staying in my building?".
- A stay that has become residence is visible instead of invisible.
- A two-night guest costs nobody a customer record.

**Non-Goals**

- Changing anything about money. No occupant count, no water, no per-person fee, no
  invoice. Stated three times in the specs because it is the thing most likely to be
  "improved" later by accident.
- Deciding when a visitor becomes an occupant. The system flags; the owner decides.
- Producing the temporary-residence filing itself — a form, an export, a submission. The
  data is recorded so it CAN be filed; printing it is a separate change and was not
  asked for.
- Approval. A tenant registers; the owner is not asked to consent first. A log that
  requires permission is a log that stops being filled in.
- Giving a visitor a login, a portal link, or any access.

## Decisions

### Its own table, not a `customer`

A `customer` is somebody who rents. That list is what a lease signatory is picked from,
and a picker holding everybody who ever visited is worse at its job. The cost is that a
visitor who later rents is typed twice — acceptable, and rare.

`LeaseVisitor` carries its own name, document number and two image keys rather than
pointing at a `User`.

### Attached to the tenancy, not the room

A visit is somebody's guest, not the room's. When the tenancy ends, the registrations go
with it into that tenancy's history, where they belong — the next tenant's guests are
nothing to do with them.

### The expected end date is required

The feature's whole value is the fourteen-day flag, and a nullable end date is how every
record quietly becomes "still here, indefinitely". The form turns "I don't know" into a
date and says the stay can be extended.

### Fourteen days, measured to today

A constant, not a setting. One building, one owner, one sensible number; a setting would
be a screen, a migration and a default that nobody ever changes. If a second owner ever
disagrees, that is when it becomes a column.

Measured from the start to today for an open stay, and to the recorded end for a finished
one — so a long stay last year still reads as having been long without appearing as
something to deal with now.

### The flag suggests, and does nothing

It names the consequence — the occupant count does not include this person — and offers
the existing control that fixes it. Changing the count automatically would alter what a
tenant is billed because of a form they filled in themselves, which is the kind of
surprise that makes people stop filling in forms.

### Photographs optional at registration

A tenant standing in a corridor without their cousin's ID card will abandon a form that
demands it, and the registration is worth more than the photograph. Filed first, images
added after.

### The portal gains a write, and no more reach

A fifth portal route, scoped by the same token to the same tenancy. The portal remains a
public surface granting nothing an owner's session grants, and the specs restate the 404
for another tenancy's records because that is the failure worth testing.

## Risks / Trade-offs

- **Identity documents of people who are not customers.** More personal data, held for
  longer, about people with no relationship to the business. → Same storage, same
  short-lived links, same rule that the images are never opened in development. Worth the
  owner knowing it is a real obligation, not a checkbox.
- **The fourteen-day flag will be ignored.** → Then the system is no worse than today,
  where there is nothing to ignore. It costs one badge.
- **A tenant could register nobody and house four people.** → True, and unchanged by this
  feature; nothing here detects an unregistered guest. This makes honesty easy, not
  dishonesty hard.
- **"Can be used for temporary-residence registration" may turn out to mean "produces the
  filing".** → It does not, here. If the owner wants an export or a printed form, that is
  the next change and the data will support it.
