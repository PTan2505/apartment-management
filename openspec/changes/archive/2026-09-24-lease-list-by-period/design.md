## Context

`GET /leases` filters by room, building, customer, `active` and `overdue`, and orders most-recently-begun first. A lease carries `startDate`, `expectedEndDate` (derived from the term), `moveOutDate` (set when it closes) and `cancelledAt`.

The list column is `coverLabel`: a dash-joined range, or "Huỷ ngày …" for a cancelled tenancy.

## Goals / Non-Goals

**Goals.** Two columns that line up. Two bounds that constrain the start and the end, usable alone or together.

**Non-Goals.** No sorting by either date — the list's order is settled and argued for elsewhere. No presets ("this quarter"), no comparison of agreed against actual beyond marking which is shown.

## Decisions

### Each bound constrains its own end

`from` applies to `startDate`; `to` applies to the covering end. Given both, the two together mean containment — which is what an owner naming a window is asking for, and why this is not an overlap filter: a tenancy that began years earlier and is still running did not begin and end inside the period.

The covering end is `moveOutDate ?? expectedEndDate`. Prisma cannot express "this column if not null, else that one" in a `where`, so the to-bound is written as the union it actually is:

- tenancies with a move-out, compared on `moveOutDate`
- tenancies without one, compared on `expectedEndDate`

An `OR` of two `AND`s, which is exactly what the sentence above says, and it keeps the filter in the database where pagination needs it.

### The screen says what each bound does

A date field labelled "từ" could as easily mean "still running from". The two readings differ by every long tenancy in the list, so the filter says which it is rather than leaving the owner to find out by noticing something missing.

### Cancelled tenancies are excluded by the filter, not hidden by it

They match nothing, which is different from being filtered out: without a period they still appear in the list, as they do today. The exclusion belongs to the question — "which tenancies ran then" — and a cancelled one ran never.

This mirrors the rule the rooms filter follows, and the one the signing guard follows: a cancelled tenancy holds no room and covers no day.

### Two columns, and the ending one says which date it is

`Bắt đầu` and `Kết thúc`. The ending cell shows the covering end, with a caption distinguishing a recorded move-out from an agreed end — "ended in June" and "agreed to end in June" are different claims, and a column that flattens them would let a reader take one for the other.

A cancelled tenancy shows neither: its cells say it was cancelled, as `coverLabel` already does.

### The phone layout keeps one line

The cards are not a table and do not gain a column; the two dates stay on one line there, as they read now. Splitting them into two lines on a 390px card would cost a line to gain an alignment that a single-column card cannot use.

## Risks / Trade-offs

**Containment hides the long tenancies.** An owner naming last October will not see a tenancy that ran all year — correct for the question as asked, and the reason the screen states what the bounds do. If "which tenancies ran during October" turns out to be the more common question, it is a second filter rather than a change to this one.

**Two date columns make the table wider.** The rent and status columns are narrow and the table has room at the widths this project supports; measured at 1440px as part of the verification.
