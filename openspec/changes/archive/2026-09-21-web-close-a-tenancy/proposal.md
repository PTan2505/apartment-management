## Why

A tenancy cannot be ended from any screen.

`POST /leases/:id/move-out` exists, is specified, and is called by nothing: it closes a tenancy on the day the tenant actually left, takes the closing meter reading, bills the final month, closes the occupancy records and frees the room. So does `GET /leases/:id/deposit-settlement` and `POST /leases/:id/deposit-refund` — the deposit a tenant is owed back, and the act of returning it. None of the three has a button.

What an owner can reach is "Huỷ hợp đồng", which records that a tenancy NEVER HAPPENED. Using it on a tenant who lived somewhere for a year would erase the year.

This was found while building the renewal screen, and it has already produced a wrong message: the refusal shown when the last occupant tries to leave says to use the tenancy's move-out — an action that does not exist. A screen that names an action the owner cannot find is worse than one that says nothing.

## What Changes

- A "Kết thúc hợp đồng" action on a running tenancy: the date the tenant actually left and the meter reading taken at handover.
- Where the departure falls after the agreed end date, the dialog says so and lets the owner name charges for those days, each picked from the building's fee catalogue, with the amount their own.
- What the closing will do is stated before it is confirmed: the final bill for that month, the occupants recorded as departed, the room freed.
- After a move-out, the tenancy shows what the deposit settlement stands at — what is held, what has been deducted, what is still owed on invoices — and lets the owner record the return of what is left.
- **Fix:** the refusal shown when the last occupant tries to depart now names this action, which exists.

## Capabilities

### Modified Capabilities

- `web-leases`: the owner can close a running tenancy, and settle its deposit afterwards.

## Impact

- `frontend` only. Three endpoints that already exist gain their first caller; one more (`GET /buildings/:id/service-fees`) is read to offer the overdue charges.
- One Vietnamese string corrected, because it currently points at nothing.
- New Vietnamese strings, reported for review rather than chosen silently.
