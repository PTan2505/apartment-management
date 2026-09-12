## Why

`api-lease-agreement-terms` added five columns to a tenancy — a reference, the notice required to end it, the day of the month rent falls due, the opening water reading, and the date the handover was signed. The API returns all five. No screen shows any of them, and no screen can record them either, so four of the five are null on every tenancy in the system.

That is the awkward part of this change and the reason it is not only a display change. Showing the fields alone would put "Chưa ghi nhận" beside four rows of every tenancy with no way to act on it — a screen that reports a gap it refuses to let the owner close. The update endpoint already accepts all four, so the missing half is a form, not an API.

The reference is different: it is generated and never accepted from a caller, so it is read-only by design and already carries a value on every tenancy.

## What Changes

- The tenancy detail screen shows the agreement terms: the reference, the notice period, the payment day, the opening water reading, and the handover date.
- The terms dialog accepts the four that are recordable, so a value shown as missing can be supplied from the screen that reports it missing.
- The reference is shown but never offered for editing.

## Deliberately not built

**A water reading on the lease creation form.** The electricity reading is there because the first bill is measured from it and the room carries a last known value to default from. Water is billed per person in this system, so the opening reading has nothing that consumes it yet; adding it to the signing form would ask for a number at the busiest moment for a bill that never reads it.

**Validation that the payment day exists in a given month.** The API takes 1–31 deliberately: it is the day an agreement names, and a February tenancy with a payment day of 30 is the biller's problem rather than this field's.

## Capabilities

### Modified Capabilities

- `web-leases`: the tenancy screen shows the agreed terms, and lets the recordable ones be entered.

## Impact

- `frontend/src/features/leases/` — the lease type, the detail screen's terms card, the edit-terms dialog and its schema.
- No backend change: `api-lease-agreement-terms` shipped both the fields and the update path.
