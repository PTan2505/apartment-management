## Context

`GET /invoices` filters by building, room, lease, year, month, payment status and `includeVoided`, and orders `year ASC, month ASC, id ASC`. The response already carries `type` and `issueDate`; the list screen shows neither.

The frontend already has Vietnamese names for every kind — `invoiceTypeLabel`: Nhận phòng, Hàng tháng, Tất toán, Quá hạn, Phát sinh — used on the invoice page and nowhere in the list.

## Goals / Non-Goals

**Goals.** A row that can be read without opening it. A list whose first page holds the bills worth acting on. Filtering and ordering that survive pagination.

**Non-Goals.** No new columns beyond kind and issue date. No saved views, no multi-column sorting, no sorting by amount — none of which anyone has asked for, and each of which is a control to explain.

## Decisions

### Ordering is the API's job, not the table's

The list is paginated. A client-side sort orders the thirty rows it has and presents them as if they were the whole set — which is worse than not sorting, because it looks right.

So the order is a query parameter: `sort=owing | newest | oldest`. `owing` is the default and means unpaid before paid, newest first within each.

### Withdrawn bills sort last in every order

Not filtered — they are excluded by default and shown only when asked for — but when shown they go after the live ones. A withdrawn bill is a record of something cancelled; finding one between two live bills is finding it in the way.

This makes every order two keys deep before its own key: `voidedAt IS NULL DESC`, then the chosen key, then `id`. Prisma expresses the first as ordering on a nullable column, which needs the raw `nulls` control — if that proves awkward, sorting on a boolean-producing expression is the fallback, not dropping the rule.

### The default order changes, deliberately

From oldest-first to owed-first-then-newest. This is a behaviour change for anyone holding the old assumption; the only caller is this frontend.

The tenancy listing already records this argument: "the tenancy an owner has just signed, or is about to act on, is the recent one; ordering oldest-first puts it on the last page and makes the common case the hardest to reach". The same is true of a bill, twice over — the recent one AND the unpaid one are both what this screen is for.

### Kind is a filter, not a tab strip

One more select beside the four that exist, defaulting to all kinds. Tabs would give five kinds top billing over building and room, which are what an owner narrows by first, and would not combine with the other filters as obviously.

### Two columns, no more

Kind and issue date. The period stays — it answers a different question ("which month is this about") and is empty on bills that cover none, which is itself informative.

On a phone the table becomes cards, as the other screens do; the kind belongs in the card's first line, where it identifies the row.

## Risks / Trade-offs

**A default order change can surprise.** An owner used to reading the list top-down as a chronology will find the newest at the top. Mitigated by the order being visible and switchable, with oldest-first one click away.

**Five kinds is a filter that will mostly sit on "all".** Accepted: it costs one control and answers a question that currently has no answer at all.
