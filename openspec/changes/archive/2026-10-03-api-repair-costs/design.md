## Context

See proposal.md — Why. Four facts about the existing system shaped every decision here,
and all four were checked rather than assumed:

- `ExpenseCategory` already contains `repair`.
- The revenue report already computes `netBilled = billed − expenses` and
  `netSettled = settled − expenses`, and already returns `expensesByCategory`. Nothing in
  it needs to know this feature exists.
- A `DamageReport` reaches a room and a building through its tenancy, and records
  `closedAt` and `closingNote`.
- `Expense` already carries `buildingId`, a nullable `roomId`, `incurredAt`, `origin`,
  and a nullable `quantity`/`unitRate` pair for measured costs.

So the feature is one nullable column, one endpoint, one dialog — and a role change that
only became visible once the column was placed.

## Goals / Non-Goals

**Goals**

- A repair's cost reaches the owner's net figure with nobody re-typing a room or a date.
- One figure, one home.
- The role rule that governs it is the same rule one screen over.

**Non-Goals**

- Billing a tenant for damage. A different question with a different answer — damage a
  tenant is liable for goes on an ad-hoc invoice, which already exists.
- Deducting it from a deposit. Same reason: the system already refuses a second, weaker
  way to keep money.
- Parts, labour, suppliers, or several costs per repair. One repair, one figure. A
  breakdown is a different feature and would make the single-home rule harder, not easier.
- Touching the revenue report.
- Letting maintenance record money. Put to the owner explicitly and declined.

## Decisions

### The amount lives on the expense; the report has no amount column

`Expense.damageReportId Int? @unique` — the reference points from the money to the
repair, not the other way round.

A `cost` column on `DamageReport` plus an `Expense.amount` is two records of one number.
This codebase has been bitten by that shape before and states the rule in the schema
itself: a derived third value can disagree with what it came from, and then no reader can
tell which is wrong. "Has this been costed?" becomes a join rather than a column, which
is the correct trade: the question is asked on one screen, and the alternative is a
figure that silently drifts.

`@unique` is what enforces one repair, one cost. A second recording is an UPDATE of the
existing row, not an insert — so a repair cannot be double-counted in a month's total
even if two tabs are open.

Alternative considered: no reference at all, just an ordinary expense whose description
mentions the report. Rejected — nothing could then show the cost on the report, nothing
could prevent two, and correcting one would be a search.

### The date is the repair's, not the typist's

`incurredAt` defaults to `closedAt` and the owner may change it. Recording a cost in May
for a repair in March therefore moves March's figures.

That sounds alarming and is not new: every expense in the system already behaves this
way, because `createExpense` has always taken an `incurredAt` the owner chooses. Making
this one date itself to the day it was typed would make it the only expense in the system
that lies about when the money went.

### Writing expenses becomes owner-only, and that is part of THIS change

It would be tidier to leave it out. It cannot be left out: the repair cost is an ordinary
`Expense` row, the expenses screen is `requireRole("owner", "manager")` for every verb,
and a manager could therefore edit or delete the very figure this change restricts to the
owner. Shipping the restriction without this would be a rule that reads well and enforces
nothing.

Reading stays open to a manager within their buildings. They run the building; they have
to see what it costs. This matches the line already drawn over invoices and payments —
a manager reads every figure and declares none.

The owner called this temporary. Nothing here depends on it staying that way: reversing
it is restoring one role on one router.

### The entry point is the report, not the expenses screen

The owner learns the number by reading the closing note on a report. Asking them to open
a second screen and re-state the building, the room and the date is how a cost stops
being recorded. The dialog takes an amount, a date it has already defaulted, and nothing
else.

### No new error codes for the role refusal

`ROLE_NOT_PERMITTED` already says it, and the screens already translate it. A bespoke
code would be a second phrasing of an existing refusal.

## Risks / Trade-offs

- **A repair cost recorded late changes a month the owner has already looked at.** →
  Inherent to expenses and unchanged by this; the alternative is worse. Worth saying out
  loud in the dialog's helper text rather than in a design document nobody reads.
- **Reading the cost on a report list is a join per page.** → Bounded: the reports list
  pages, and the expense is fetched with the report rather than per row.
- **Narrowing expenses to the owner removes something a manager could do yesterday.** →
  Deliberate, and the owner asked for it. The screen must say nothing about it: the
  controls are simply absent, by the rule already in `web-staff`.
- **"No cost" and "cost of zero" are different and will be confused by somebody.** → The
  screen says which it is in words, not by showing an empty field; the same distinction
  the room's opening meter reading already makes.
