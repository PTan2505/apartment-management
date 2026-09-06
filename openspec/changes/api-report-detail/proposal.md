## Why

The revenue report answers what a month earned down to the building and stops there. Every question that follows — which rooms have not paid, how many rooms the figures cover, which of those five expense vouchers was the big one — needs a different screen, a different filter, and a reader who remembers what the report said while they go and look.

This surfaced concretely while redesigning the revenue screen. The design's largest element is a per-room payment table, and it could not be built: the report holds nothing below a building. Assembling it in the browser from the invoice list was considered and rejected in that change's design — it would be a second revenue report, computed from a different source, free to disagree with the one the screen is named after.

**This change exists so that work has a home outside the archive.** Three redesigns in a row stopped, named what the API did not report, and recorded it in a proposal that then moved into `openspec/changes/archive/`. Nobody reads the archive. Six months from now the revenue screen will not look like its design and there will be no open record of why.

## What Changes

- The revenue report SHALL report, per building and per month, the rooms it is summarising: for each, the tenancy responsible, what was billed, what has been collected, and whether it is settled.
- The report SHALL state how many rooms each figure covers, and how many of those are collected and outstanding — the counts a reader currently gets by counting rows.
- Expense totals SHALL carry the number of expense records behind them, so "14.500.000 across 5 vouchers" is one figure rather than two screens.
- The room-level detail SHALL be requestable independently of the summary, so a caller that only wants totals does not pay for a room list it will not read.

### Explicitly out of scope, and why

**The contract file's name, size and upload time.** The lease API withholds these on purpose: the storage key never reaches the browser and every link is signed at the moment it is asked for. Adding them would trade a real security property for a line of text.

**A data-freshness timestamp and an export endpoint.** Both are real requests, and neither is about the report holding more detail. They belong to their own changes rather than being smuggled into this one.

**The lease agreement's own missing fields** — contract code, notice period, payment cycle, opening water reading, handover and signature flags — which the lease-detail redesign named. They are terms of an agreement, not report detail; a separate change covers them. See `api-lease-agreement-terms`.

## Capabilities

### Modified Capabilities

- `revenue-report`: the report gains room-level detail, the counts behind its figures, and a way to ask for the summary without the detail.

## Impact

- `backend/src/modules/reports/` — the revenue query and its response shape.
- **BREAKING for nobody yet**: the additions are additive, and the room detail is opt-in, so an existing caller that ignores the new fields keeps working unchanged.
- The frontend revenue screen can then build the per-room table its design calls for. That is a separate frontend change and not part of this one.
