## Why

Seven actions in the application change something real the moment they are clicked, with nothing between the click and the request: a payment is reversed, an ID-card photo is deleted, a stored file is overwritten or removed, a building or room is put back in service. The owner asked for this after using the screens — a single mis-click on "Hoàn tiền cho khách" moves money and returns an invoice to unpaid, and nothing asks whether that was meant.

The application is not inconsistent by accident: the destructive actions that arrived with their own screens (retiring, withdrawing an invoice, cancelling a tenancy, removing a cost) all confirm. The ones that arrived as a button on an existing screen do not. The rule exists; it was never written down, so each new button was decided on its own.

## What Changes

- A written rule, in `web-infrastructure`, for when an action must be confirmed before its request is sent, and what the confirmation must say.
- A shared confirmation dialog, so the answer is the same shape everywhere rather than seven hand-built dialogs.
- Confirmation added to the seven actions that send immediately today:
  - reversing a payment (naming the amount, the date it was received, and that the invoice returns to unpaid)
  - removing an ID-card photo (front and back)
  - removing the contract template; replacing it, because the file it replaces is deleted
  - replacing a signed contract scan and replacing an ID-card photo, for the same reason
  - restoring a building, and restoring a room
- Confirmation on **saving a form that changes money**: the building's rates, a room's rent, a cost's amount, a tenancy's electricity and water rates. The dialog lists each changed figure as `cũ → mới`. Forms that change nothing monetary (a customer's details, a tenancy's occupant count) keep saving directly — the Save button inside a form dialog is already a deliberate step.
- **BREAKING (spec-level):** `web-rooms` and `web-buildings` currently require that restoring is **not** confirmed. That requirement is reversed.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `web-infrastructure`: a new cross-cutting requirement — an action that cannot be taken back is confirmed before it is sent, and the confirmation names what will happen.
- `web-buildings`: the retire/restore requirement is replaced by one in which both are confirmed; and a new requirement — saving changed rates is confirmed.
- `web-rooms`: the retire/restore requirement is replaced by one in which both are confirmed; and a new requirement — saving a changed rent is confirmed.
- `web-invoices`: reversing a payment is confirmed, and the confirmation names the amount and the consequence.
- `web-expenses`: correcting a cost's amount is confirmed.
- `web-leases`: correcting a tenancy's utility rates is confirmed.

## Impact

- Frontend only. No API, schema or migration changes — the same requests are sent, just later and only on purpose.
- New shared component under `frontend/src/components/`.
- Touched: `InvoiceDetailPage`, `IdCardCard`, `ContractCard`, `ContractTemplateBar`, `BuildingsPage`, `RoomsSection`, `BuildingFormDialog`, `RoomFormDialog`, `ExpenseFormDialog`, `EditTermsDialog`.
- Two active changes not yet archived — `api-customer-id-card` and `web-contract-template` — own screens this touches. Their specs are unaffected: the rule lives in `web-infrastructure` and covers them.
- New Vietnamese strings, to be reported for review rather than chosen silently.
