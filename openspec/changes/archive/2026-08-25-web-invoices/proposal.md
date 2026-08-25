## Why

Billing is the work this system exists for, and it is the one thing an owner still cannot do from a screen. Buildings, rooms, customers and tenancies are all reachable; the money is not. A tenancy can be signed and then nothing further happens to it — no bill is ever issued, nothing is ever collected, and the revenue report an owner opens is empty for reasons that have nothing to do with their business.

It is also the work that repeats. Every other screen so far handles an event that happens once or twice a year: a building is added, a room is let, a tenant moves in. Billing happens to every occupied room every month, and a design that is merely tolerable once becomes intolerable at twenty rooms twelve times a year.

That repetition shapes the whole change. The real task is not "issue an invoice" but **"close off this month"** — walk the building reading meters, then sit down and enter what was read. An owner doing that has one question the current API cannot answer: *which rooms have I not done yet?* Nothing today can tell them, and a room silently missed is a month of rent never billed and never noticed.

## What Changes

- **A month-end billing screen.** One table listing every tenancy that should be billed for a chosen month and has not been, each row taking the new meter reading beside the reading it opens from. The owner works down the list and issues them. What is left on the table is what has not been done — which is the answer to the question above, made visible by the shape of the screen rather than by a warning.
- **The API reports what is due to be billed**, because the screen cannot work it out cheaply. Deciding which tenancies still need an invoice means combining the tenancies running that month with the invoices already issued for it, and the opening meter reading is a per-tenancy lookup on top. Assembled in the browser that is a request per room and a copy of a billing rule the backend already owns.
- **Invoices can be listed, filtered and read in full** — by building, room, month and whether they are settled. A bill that cannot be read cannot be explained to the tenant who is querying it, and every charge on it is already recorded line by line with the rates it was computed from.
- **Payment can be recorded, and recorded payments reversed.** An issued invoice nobody marks as paid is an invoice the revenue report counts as owed forever. Reversal exists because the mistake this screen will actually make is marking the wrong bill paid, and a system with no way back turns a slip into a permanent wrong figure.

Deliberately NOT in this change:

- **Voiding an invoice.** This is a real gap and worth naming rather than leaving to be discovered: entering meter readings for a whole building will sometimes produce a typo, and without voiding, a wrong invoice cannot be corrected from any screen at all. The owner would have to reach the API directly. Excluded on request to keep this change to a workable size; it is the first thing to add back.
- **Ad-hoc invoices** for charges the owner decides — a lost key, a broken window. A separate operation with a separate screen.
- **Issuing a payment link.** The gateway is reachable only from the tenant portal, by the tenant. Nothing here changes that.

## Capabilities

### New Capabilities

- `web-invoices`: the owner's screens for billing — closing off a month, reading a bill, and recording what has been collected.

### Modified Capabilities

- `invoice`: the system reports which tenancies are due to be billed for a given month, and what meter reading each would open from.

## Impact

- `frontend/src/features/invoices/` — new: the billing run, the list, the invoice detail, the payment dialogs.
- `frontend/src/app/` — a route and a navigation entry.
- `backend/src/modules/invoices/` — the endpoint reporting what is due for a month.
- No change to how any charge is computed. Every rule about proration, metered electricity, service fees and invoice kinds already exists and is already specified; this change gives it a way in.
