## Why

The move-out dialog offers the room's last known meter reading beside the field
it wants a closing reading in. On a tenancy that has been billed monthly, that
figure is stale — it comes from the reading the tenancy opened from, or from the
room's own opening reading, and ignores every reading since recorded ON AN
INVOICE.

So the screen tells the owner the meter stands at 1.411, they enter 1.500, and
the API refuses it: the tenancy's September bill already recorded 1.750. The
hint and the rule are reading different sources about the same meter.

It is not a rare corner: 11 of 62 running tenancies in the development database
are in this state right now, every one of them a tenancy that has been billed.

## What Changes

- A reading recorded on an invoice counts as a known meter position for the
  room, dated at the end of the period it billed.
- The hint and the refusal therefore consult the same history, and a figure the
  screen shows as current can no longer be rejected as too low.

## Impact

- Affected specs: `room`
- Affected code: `backend/src/lib/meter-history.ts`, and the reading source
  reported by `GET /rooms/:id/meter-reading`
