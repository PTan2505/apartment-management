## Why

When something breaks, the tenant texts the owner — or does not, and the owner
finds out when it is worse. Nothing in the system records that a room needs
fixing, who was told, or when somebody said they would come.

The maintenance role has nothing to do until this exists: it is the only thing
that role sees.

## What Changes

- A tenant raises a damage report from their portal link. It belongs to the
  tenancy the link was issued for, and therefore to a room and a building.
- Staff of that building — manager or maintenance — see it, record the
  appointment they agreed with the tenant, and close it when the work is done.
- Three states: new, scheduled, done. The tenant sees the state and the
  appointment through the same link they raised it from.
- The owner sees every report, as they see everything.

## Impact

- Affected specs: `damage-report` (new), `tenant-portal`
- Affected code: `backend/prisma/schema.prisma` (+ migration), a new
  `backend/src/modules/damage-reports/*`, and the portal module
