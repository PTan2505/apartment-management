## Context

See proposal.md — Why. What shapes the approach, checked rather than assumed:

- `Invoice` is identified by `(leaseId, year, month)` through a partial unique index, `WHERE voidedAt IS NULL`. That single index is both the identity and the duplicate guard.
- `year`/`month` currently mean the calendar month billed, and because rent and utilities are both charged for that month, nothing has ever had to say which of the two the label refers to.
- `createdAt` already exists on every invoice and is exactly when it was issued, since nothing back-dates an invoice today.
- The revenue report reads `totalAmount` and groups by `year`/`month`. It is untouched here.
- `InvoiceLineKind` was extended once already (`serviceFee`), so adding an enum value in a migration is a path this project has walked.

## Goals / Non-Goals

**Goals:**

- Make room for four kinds of invoice before any of them exist.
- Separate "when this was billed" from "what period it covers", which are the same fact today and will not be.
- Change no amount, and be able to demonstrate it.

**Non-Goals:**

- Issuing move-in, final, or overdue invoices. The next change.
- Rent in advance, deposits, the revenue report.
- Grouping anything by issue date. The field is recorded; nothing reads it yet.

## Decisions

### `year`/`month` keep meaning the utilities period, in this change and the next

The temptation is to treat the label as "the month this invoice is about" and let it drift once rent moves a month ahead. That would leave a field whose meaning depends on which change you read it after.

It means the utilities period now, and it will still mean the utilities period when rent is billed a month in advance. What changes in the next change is which month's *rent* sits beside those utilities — not what the label refers to. Saying so here, while the two coincide and the distinction costs nothing, is cheaper than discovering the ambiguity later with money attached.

### The duplicate guard narrows to monthly invoices, rather than widening to include the kind

The index becomes `(leaseId, year, month) WHERE voidedAt IS NULL AND type = 'monthly'`.

Adding `type` to the key instead — `(leaseId, year, month, type)` — would also work today and would be wrong later. It would permit one move-in invoice *per month* for a lease, when the rule is one per lease, and one final invoice per month when the rule is one per tenancy. Those rules do not fit a month-shaped key at all, so they will get their own guards in the change that introduces them.

Narrowing now means each kind gets the guard its own rule needs, rather than inheriting one shaped for a different rule.

### The issue date may be supplied, defaulting to now

An owner who bills January in March has an invoice covering January and issued in March. Both are true and the report change groups by the second, so the field has to be able to say something other than "now" — otherwise a batch of late invoices all land in the month someone happened to enter them.

Defaulting to now keeps the common case silent. Existing rows backfill from `createdAt`, which is precisely when they were issued.

**Alternative considered:** deriving the issue date from `createdAt` and not storing a separate column. Rejected because `createdAt` is a record-keeping timestamp — it moves if a row is ever recreated, and it cannot be set to a date in the past. The two facts coincide today and are not the same fact.

### Every invoice becomes `monthly`, and nothing issues anything else

The enum carries all four kinds from the start, because adding the values later is a second migration for no benefit and the spec is clearer stating the whole set at once. Only monthly is reachable until the next change.

## Risks / Trade-offs

- **An enum with three unreachable values invites someone to use one.** A caller could set `type` if generation ever accepted it as input. → Generation does not take it; the kind is decided by which operation issued the invoice, and it stays that way in the next change. Worth stating because "add a field, accept it as input" is the reflex.

- **"No amount changes" is easy to assert and easy to skip.** → The verification generates the same invoices from the same inputs before and after and compares every charge, not just the totals. Three wrong charges can sum to a right total, which is why the earlier line-item change checked them individually and this one does too.

- **Narrowing the index is a destructive migration step.** Dropping and recreating a unique index briefly leaves the table unguarded. → It runs inside the migration's transaction, so nothing can insert between the two statements.

- **The issue date being settable allows dating an invoice dishonestly.** → Accepted: the owner is the only user, and the alternative is making a late batch of invoices unreportable. No constraint is placed on it in this change, which is worth revisiting when the report actually groups by it.
