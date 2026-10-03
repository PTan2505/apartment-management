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
- The owner can print the temporary-residence form without copying anything out by hand.
- A stay that has become residence is visible instead of invisible.
- A two-night guest costs nobody a customer record.

**Non-Goals**

- Changing anything about money. No occupant count, no water, no per-person fee, no
  invoice. Stated three times in the specs because it is the thing most likely to be
  "improved" later by accident.
- Deciding when a visitor becomes an occupant. The system flags; the owner decides.
- Judging whether a filing is legally correct, or submitting it anywhere. The system
  fills the form and hands it over; a person reads it, signs it and takes it in. Four
  signature blocks at the foot of the form say plainly that this was always going to be
  true, and they are why a form filled nine-tenths of the way is useful rather than
  half-broken.
- Holding the filled documents. They are derived from records that change, and a kept copy
  starts disagreeing with them the first time a date is corrected.
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

### The form is a template the owner uploads, not a layout we draw

Three ways to produce CT01 were on the table:

```
  A  Draw the layout ourselves (HTML/print CSS, or a PDF built from scratch)
       + no file needed from anybody
       − we now own the appearance of a government form, and reissues are deployments
       − an agency that rejects it rejects a thing only we can fix

  B  A fillable PDF with named form fields
       + exact official layout
       − somebody must create that version by hand in Acrobat, field by field
       − the owner cannot redo that work when the form is reissued

  C  A .docx carrying named placeholders, uploaded by the owner      ← chosen
       + exact official layout, because it IS the published file
       + the owner replaces it themselves when the regulation changes
       + .docx is what the authorities actually publish CT01 as
       − the placeholders have to be inserted into the file once
```

C, and it reuses machinery that already exists: the blank contract is already one object
in storage with no database row, replaced rather than versioned. The blank form is the
same shape for the same reasons, under its own prefix.

The cost of C is one manual step — putting `{hoTen}`-style markers into the published file
— paid once, by whoever has the file. It buys an owner who is never waiting on a
deployment when the Ministry reissues the form, which over the life of this system is the
thing that will actually happen.

### A payload that any renderer could fill

Resolving the form's values and writing them into a document are separate steps, and the
resolve step is the one worth getting right: it decides who the head of household is,
which address counts, and what is missing. The document writer consumes that and does no
thinking.

So if C turns out to be wrong — the owner cannot produce the file, an agency insists on a
PDF — what gets replaced is the last step, not the feature.

### The head of household is the signatory, not the landlord

The form asks who heads the household at the address. That is the person registered as
living there, which is the tenant who signed. Naming the landlord would be a false
statement on a government form, and it is an easy mistake to make from inside a landlord's
software where the owner is the main character.

### The signatory's identity NUMBER has to be stored

The system holds photographs of identity cards and has never held the number on one. The
form has a box for the head of household's number; a photograph cannot be typed into a box.

So `User` gains one nullable column. Nullable because every customer recorded before now
has none, and because an owner entering an old paper tenancy may never have been given it —
and the form prints with that box empty rather than refusing.

### Empty beats plausible

Where there is no record, the box is empty and the owner is told which boxes those are.
No defaults, no placeholder text, no inference.

This is a document somebody signs and hands to the police. A blank gets noticed and filled
in; a guess gets signed. The report of missing boxes is shown on screen BEFORE the download,
because the only useful time to learn the signatory's number is missing is before the trip
to the printer.

### The filing is staff-only, including from the tenant's own registration

A tenant can register their cousin and cannot produce the filing. The document carries the
signatory's identity number and every co-arriving visitor's personal details — more reach
than registering one guest was ever meant to grant.

### The bytes do pass through the API, and that is correct here

The project's rule is that large file bytes never go through Express. This document is
generated, roughly a hundred kilobytes, and exists nowhere until it is asked for: there is
no object to sign a URL for. Reading the blank from storage, filling it and streaming the
result is the only shape available, and it is not the case the rule was written about.

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
- **The blank form must carry placeholders before anything works.** → The machinery is
  built and verified against a template holding the full placeholder set, so the step that
  remains is supplying the real file rather than finishing the feature. Until one is
  uploaded the screen says so and offers no download, which is the honest state.
- **The owner uploads a file that is not a template.** → A published CT01 with no
  placeholders fills nothing and comes back blank. The filing reports every box it could
  not fill, so a template with no markers reports all of them — a loud failure rather than
  a silent one.
- **A longer registration form means fewer registrations.** → Real, and the reason the
  optional fields are visibly optional and the photographs stay optional. The required set
  is exactly the form's required set and no more; the page says in one line what the boxes
  are for.
- **More personal data about more people, for longer.** → Already true of the ID
  photographs; this adds dates of birth and home addresses of people with no relationship
  to the business. Worth the owner knowing it is a real obligation.
