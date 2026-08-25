## Context

See proposal.md — Why. What shapes the approach:

- Recording a vacancy is already refused where a tenancy covered the month's LAST DAY, and already refused twice for the same room and month. Neither rule is being revisited.
- A room's meter position is resolved from three places — a lease's opening reading, its closing reading, and any vacancy record — and the most recent wins. That resolution already exists and is used by lease creation and by invoicing.
- An expense records whether the system or the owner created it, and both are correctable. Deleting removes outright; there is no voided state, unlike an invoice.
- An amount may be derived from a quantity and a rate, and the API computes it when both are supplied so a stored figure cannot disagree with its basis.
- The billing run built for `web-invoices` is the same shape of problem and its decisions were measured: per-row issuing, a server-reported worklist, the opening figure shown beside the field.

## Goals / Non-Goals

**Goals:**

- Give the revenue report its other half, so its figures stop being unknowably optimistic.
- Make the cost an owner cannot see missing — a vacant room's electricity — visible as outstanding work.
- Keep correction available, since the mistake here is the same mistyped reading as in billing.

**Non-Goals:**

- Recovering a cost from a tenant. That is an ad-hoc charge on an invoice.
- Budgets, forecasts, recurring costs.
- Changing vacancy reconciliation, the derivation of amounts, or the revenue report.

## Decisions

**The vacancy round reuses the billing run's shape, deliberately.**

Month picker, building filter, one row per outstanding item, the opening figure beside the field, per-row submission, the row leaving on success, and "the month is done" instead of an empty table. Not because it is convenient, but because the two are the same task — a per-room round, once a month, where the risk is silently skipping one — and an owner who has learned one screen has learned the other.

Per-row rather than batched, for the reason measured last time: one bad reading among twenty must not roll back nineteen correct records, and a failure has to belong to the row that caused it.

**Occupancy is judged at the month's END, matching the rule that already refuses the record.**

A room let on the 20th was occupied when the month closed, and the whole month's consumption goes on the tenant's invoice — the API refuses a vacancy record for it. The listing has to use the same test, or it offers rows that cannot be acted on.

This is the part most likely to be got wrong by re-deriving it, because "was the room empty during March" and "was the room empty at the end of March" are different questions with the same plausible-sounding name.

**A room with no reading at all is excluded, not reported with a null.**

Written the other way round first, and corrected while implementing: the API *refuses* to record a vacancy for a room with no known reading, because consumption is a difference and there is nothing to subtract from. Reporting such a room would have put a row on the list that cannot be acted on — the exact failure the "never appear where recording would be refused" rule above exists to prevent, in the same document that stated it.

Substituting zero is the alternative and is worse: it charges the owner for the meter's entire history. A room's first reading is taken when it is first let, on a different screen.

**The cost form asks for a quantity and rate OR an amount, not both.**

The API computes the amount when both parts are supplied, which is what stops a stored figure disagreeing with its basis. A form offering all three fields at once invites the owner to type an amount beside a quantity and a rate that do not produce it — and then silently discards what they typed.

**Removal is called removal.**

An expense is deleted outright; an invoice is voided and kept. Using one word for both would teach an owner that "delete" leaves a record, which is true in one place and false in the other. The screen says removed, and warns that it cannot be undone.

## Risks / Trade-offs

**A wrong meter reading produces a wrong cost** → Correctable, which is more than the invoice case allowed before voiding existed: the expense can be edited in place, and the system deliberately permits editing even the records it created itself.

**An owner never opens the vacancy round and the cost stays missing** → Unchanged from today in the worst case, and better in every other: the work is now visible somewhere rather than nowhere. Announcing it more loudly — a count on the dashboard — belongs with a dashboard, which does not exist.

**The vacancy listing and the vacancy guard disagree** → The listing calls the same occupancy test rather than expressing it again, and the verification checks a room let mid-month specifically, since that is the case where a plausible re-derivation differs.

## Migration Plan

No data migration. One additive read-only endpoint and a new frontend feature. Rollback is reverting the commit.
