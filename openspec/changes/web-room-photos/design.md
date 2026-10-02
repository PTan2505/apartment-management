## Context

See proposal.md — Why. The shape is already settled by three precedents in the codebase,
and the point of this design is to follow them rather than invent a fourth way:

| | table | prefix helper | ceiling |
|---|---|---|---|
| Damage report | `DamageReportPhoto` | `reportPhotoPrefix()` | 10 MB |
| Contract pages | `ContractPage` | `contractPrefix()` | 20 MB |
| ID cards | columns on `User` | `idCardPrefix()` | 10 MB |

All three sign a URL, let the browser PUT the bytes to R2, then confirm. All three read
back through short-lived signed links.

## Goals / Non-Goals

**Goals**

- A fourth instance that looks exactly like the first three.
- A room is recognisable in a list of fifty-eight.

**Non-Goals**

- Captions, ordering by hand, albums, or a "cover" flag. Upload order decides; a
  position field is a second thing to keep correct for a gain nobody asked for.
- Showing photographs to tenants. The portal is for bills and faults.
- Photographs on a BUILDING. Asked for rooms; a building's picture is a different
  feature with a different reason.
- Resizing or thumbnailing on the server. The list uses the same object with a smaller
  box; if that proves slow, a derived size is its own change with its own measurements.

## Decisions

### `RoomPhoto`, modelled on `DamageReportPhoto`

Same columns — `key @unique`, `contentType`, `uploadedAt` — same cascade on the parent,
same index on `(roomId, uploadedAt)`. Copying the shape is the point: a reader who has
understood one understands all four.

### The first photograph is the cover; there is no cover flag

A flag means a second state to set, to migrate, and to repair when the flagged
photograph is deleted. "The first one" has none of that and is wrong only in the case
where the owner wants a different one — which re-uploading fixes.

### Deleted, not retired

Every other removable thing in this system is retired rather than deleted, because a
tenancy, an invoice or a fee must stay provable. A photograph proves nothing that
anybody will later be asked to produce, so it goes.

If that turns out to be wrong — a dispute about the room's condition at hand-over — the
answer is the furniture hand-over record, which is designed to be kept.

### A manager may upload

A deliberate exception to "rooms are the owner's". What a room CHARGES is the business
deciding what it sells; what a room LOOKS like is the person standing in it with a
phone. The exception is narrow and named in the spec so the next reader does not file it
as an inconsistency.

### The placeholder keeps its size

A thumbnail column that collapses when a page of rooms happens to have no photographs
makes the table jump between pages. The empty state occupies the same box.

## Risks / Trade-offs

- **Full-size images in a list column.** A phone photograph is two to five megabytes and
  the list shows twenty. → Measured in the browser pass before anything is built on top
  of it; if it is slow, a derived size is a separate change rather than a guess now.
- **Deleting is irreversible and the object leaves storage.** → Confirmed first, and
  offered only to roles that may.
- **A fourth copy of the upload dance.** → The alternative, a generic photograph
  subsystem, would be invented for four callers with different parents, different
  ceilings and different roles. Four similar things are easier to read than one
  configurable thing.
