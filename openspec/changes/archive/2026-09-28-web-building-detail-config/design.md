## Context

See proposal.md — Why. Two constraints shaped this:

- Every field shown was already on `GET /buildings/:id`, and the fee catalogue already
  had `useBuildingServiceFees`. Nothing here needed an API change, which is why the
  change is one file.
- `web-manager-limits` had already settled who may edit a building, and `useIsOwner()`
  already existed. This page had to obey that rule, not invent a second one.

## Goals / Non-Goals

**Goals**

- The reader can tell a setting from the address above it.
- Every configured value has one visible home, including the two that had none.
- The owner changes a setting where they read it.

**Non-Goals**

- Managing the fee catalogue. It is SHOWN here; creating, repricing and retiring a fee
  still have no screen anywhere in the application. That is a real gap and a separate
  piece of work — see Open Questions.
- Retiring or restoring the building from this page. The list's row menu does it, and
  duplicating a destructive action into a second place is how the two drift apart.
- A new layout language. The tenancy page already shows facts as an overline label above
  a value; this reuses that shape rather than inventing a second one.

## Decisions

### A card, not more prose

The rates were a sentence. A sentence is right for something read once and wrong for
figures compared against each other and against the tenancy being signed. Three fields
in a grid, each with the sentence that used to be implicit written underneath it.

Alternative considered: a definition list. Rejected — at 390px a two-column list puts a
long label beside a long value and both wrap, which is how "100.000 ₫ / người / tháng"
becomes three lines.

### The fee catalogue is read-only here

Shown as chips because the useful question is "what does this building charge for?",
which is a glance, not a table. A table would promise the row actions that do not exist.

### The edit button lives on the card, not the page header

It edits what the card shows. On the page header it would sit beside "Tất cả toà nhà"
and read as an action on the page rather than on the settings.

### Imported the fee hook rather than moving it

`useBuildingServiceFees` lives in `features/leases` because the move-out dialog needed it
first, though the catalogue belongs to the building. Moving it would touch a working
dialog for a tidiness gain; importing across features is the smaller risk, and a comment
says why it is where it is.

## Risks / Trade-offs

- **A second query on page load.** → It is small, cached under the buildings key, and
  already invalidated by every building mutation, so it cannot go stale on its own.
- **Showing fees nobody can edit may read as a missing feature.** → It is one. Naming it
  in the Open Questions below rather than hiding the data until the screen exists: an
  owner who can SEE the fee at least knows what their tenants are charged.

## Open Questions

Building service fees have no management screen anywhere — `POST`, `PATCH` and the
retire/restore routes on `/buildings/:id/service-fees` exist and are owner-only, and
nothing in the application calls them. A fee can only be created with `curl`. Worth
building; deferred here because this change is about showing configuration, and adding a
fourth CRUD screen to it would bury that.
