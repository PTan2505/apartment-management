## Why

The revenue report subtracts costs from income, and an owner can now record every part of the income and none of the costs. Every figure it produces is therefore too flattering — not by a little and not predictably, but by however much was spent that month and never written down.

Two kinds of cost are missing, and they fail differently:

- **What the owner spends**: a repair, a cleaning, anything else. Missing because there is no screen; the owner knows they spent it and simply cannot say so.
- **Electricity in empty rooms**: the meter runs while a room stands empty, nobody is billed for it, and the owner pays. This one is worse, because the owner does not know it is missing. A room empty for two months has a cost nobody thought about, and nothing anywhere asks about it.

The second is the same shape as the problem the billing screen solved: work that has to be done for each room, every month, with no way to see what has not been done yet. It gets the same answer — a list of what is outstanding, which empties as it is worked through.

## What Changes

- **Recording a cost**, against a building and optionally a room. Where it is measured — units at a rate — the amount is computed from those rather than typed alongside them, so a figure can never disagree with the numbers it came from.
- **A month-end list of empty rooms whose electricity has not been recorded.** The owner enters the meter reading; the cost follows from the building's rate. What remains on the list is what has not been done, exactly as with billing.
- **The API reports which rooms are outstanding for a month**, because the screen cannot work it out cheaply: it means finding rooms no tenancy covered at that month's end, excluding those already recorded, and resolving each room's opening reading.
- **Costs can be listed, filtered, corrected and removed** — by building, room, kind, and date range. A mistyped reading has to be correctable after the fact, and the system already allows it for system-generated costs as well as entered ones.
- **A cost the system recorded is shown as such**, distinct from one the owner entered. They are equally correctable, but not equally surprising to find.

Deliberately NOT in this change:

- **Attributing a cost to a tenant.** Recovering the price of a broken window is an ad-hoc charge on an invoice, which is a different operation and belongs with invoices.
- **Budgets, forecasts, or recurring costs.** Nothing in the system records an intention to spend; this records what was spent.

## Capabilities

### New Capabilities

- `web-expenses`: the owner's screens for what a building costs them — recording it, correcting it, and closing off a month's empty rooms.

### Modified Capabilities

- `expense`: the system reports which rooms stood empty at a month's end without their electricity recorded, and what reading each would open from.

## Impact

- `frontend/src/features/expenses/` — new: the list, the form, the month-end vacancy round.
- `frontend/src/app/` — a route and the navigation entry that is still a placeholder.
- `backend/src/modules/expenses/` — the endpoint reporting what is outstanding for a month.
- No change to how any cost is computed, to vacancy reconciliation, or to the revenue report. All of it already exists and is already specified.
