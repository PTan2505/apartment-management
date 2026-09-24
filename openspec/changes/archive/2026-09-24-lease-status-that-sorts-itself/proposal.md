## Why

A tenancy has three states on screen — đang thuê, đã kết thúc, đã huỷ — and they hide the distinctions an owner acts on.

**Quá hạn** is the sharpest. A tenancy whose term ran out with no move-out recorded still reads "Đang thuê": it holds its room, no further invoice can be issued for it, and nothing says so. It is reachable today only through a switch labelled "Cần xử lý", which is a filter pretending to be a status — the fact belongs on the row, not in a toggle.

**Sắp đến hạn** cannot be seen at all. An owner asking "who do I need to talk to this month" has to read every end date and subtract.

**Chưa bắt đầu** is likewise invisible: a tenancy signed for next month reads exactly like one somebody is living in today.

And the order makes it worse. The list is most-recently-signed first, so a tenancy that ran out last week sits wherever its signing date puts it — usually far down — while the screen's whole purpose is the things that need doing.

## What Changes

- Three new states, derived rather than stored: **quá hạn** (term ended, no move-out), **sắp đến hạn** (ends within two weeks), **chưa bắt đầu** (starts in the future).
- The **"Cần xử lý" switch is removed**. What it found is now a status, filterable like any other.
- The status filter offers all six: quá hạn, sắp đến hạn, đang thuê, chưa bắt đầu, đã kết thúc, đã huỷ.
- The list **orders itself by what needs doing**: quá hạn, then sắp đến hạn, then đang thuê — those three by how little time is left — then chưa bắt đầu, đã kết thúc, đã huỷ. Within each, most recently signed first.
- Two counts at the top of the screen: **how many are overdue** and **how many are running**.

## Capabilities

### Modified Capabilities

- `lease`: the reported status distinguishes overdue, due-soon and not-yet-started; listing filters and orders by it.
- `web-leases`: the list shows the six states, filters by them, orders by what needs attention, and counts the two that matter.

## Impact

- `backend`: the lease mapper's status, the list query schema, the listing's filter and order. No schema change, no migration.
- `frontend`: `LeaseList` chips, `LeasesPage` filter and counts, lease types.
- **Breaking for API callers:** `status` gains three values, the `overdue` boolean filter is replaced by a status value, and the default order changes. The only caller is this frontend.
- New Vietnamese strings, reported for review rather than chosen silently.
