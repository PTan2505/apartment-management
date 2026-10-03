## Why

A broken window is the owner's bill, not the tenant's. The system records the breakage,
the appointment and the fix — and then loses the money entirely. Nothing says what the
repair cost, so the revenue report shows a month's rent with none of the expense that
produced it, and the owner's net figure is flattering by an amount nobody can name.

The parts needed already exist and have never been joined up. `ExpenseCategory.repair`
is in the enum. The revenue report already subtracts expenses from what was billed and
settled, and already breaks them down by category. A damage report already carries the
room, the building, and the day it was closed. What is missing is one row and one
screen.

A second gap surfaced while deciding who may enter the figure. The repair cost will live
as an ordinary `Expense`, which a manager can currently create, edit and delete from the
expenses screen — so restricting the cost to the owner at the report would mean nothing
while the same row stays editable one screen over.

## What Changes

- **A damage report can carry what it cost.** The owner records an amount; the system
  writes one expense against the room, categorised `repair`, dated to the repair.
- **The money lives in exactly one place.** No amount column on the report: the expense
  row holds it, keyed back to the report, and "has this been costed?" is answered by
  whether such a row exists. Two places to write one number is two places to disagree.
- **One report, one expense.** Recording a second cost for the same report replaces the
  figure rather than adding a row, so a repair cannot be counted twice.
- **Only the owner records it.** Maintenance gains nothing: the person who did the work
  reports the figure in the closing note the report already asks for, and the owner reads
  it there.
- **Expenses become owner-only to WRITE.** A manager keeps reading them — they run the
  building and need to see what it costs — but creating, correcting and deleting an
  expense, and recording vacancy electricity, become the owner's. This is the same line
  the owner drew over invoices and payments: a manager runs the building, and what the
  business SPENDS is not theirs to state.
- **The revenue report is untouched.** It already subtracts expenses and splits them by
  category; a repair expense appears there by existing behaviour.

## Capabilities

### Modified Capabilities

- `damage-report`: a closed report records what the repair cost, as an expense.
- `expense`: an expense may name the damage report it paid for; writing expenses requires
  the owner.
- `staff`: a manager no longer writes expenses.
- `web-staff`: the expense controls follow the rule that a control a role may not use is
  not drawn.

## Impact

- Affected specs: `damage-report`, `expense`, `staff`, `web-staff`
- Affected code: `backend/prisma/schema.prisma` (one nullable unique column on `Expense`,
  + migration), `backend/src/modules/damage-reports/*`,
  `backend/src/modules/expenses/router.ts`, and the damage-report and expense screens
- **No change to the revenue report**, its queries, or its shape.
- Existing expenses are unaffected: the new column is nullable and every current row
  keeps meaning what it meant.
