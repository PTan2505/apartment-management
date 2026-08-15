## Why

Invoices record what tenants owe and expenses record what the owner pays, but nothing puts the two together. An owner cannot currently answer the question the whole system exists to serve: what did this building earn last month, how much of it has actually arrived, and what did it cost to run. This is the last domain change on the backend roadmap and the one that makes the preceding six useful.

## What Changes

- Add a revenue report that aggregates invoices and expenses across selected buildings over a range of months.
- Report six figures per month: **billed**, **collected**, **outstanding**, **expenses**, **netBilled**, and **netCollected**.
- Key billing figures on the month an invoice covers, never on when it was paid. A March bill settled in May belongs to March in this report, so months stay comparable to one another instead of shifting as late payments arrive.
- Because an invoice is paid in full or not at all, every invoice falls entirely into collected or outstanding — so `billed = collected + outstanding` holds exactly, and outstanding is a real sum rather than a subtraction.
- Report both net figures rather than choosing between them: `netBilled` is stable once a month is billed and comparable month to month; `netCollected` reflects the cash position and keeps moving as payments arrive. They answer different questions and the second subtraction is free.
- Break expenses down by category on the building totals and the grand total, so a costly month can be explained without a second request.
- Return per-building monthly rows, a total per building, and a grand total across the selection.
- Include every month in the requested range and every requested building, reporting zeros where there was no activity, so a caller charting the result does not have to fill gaps itself.

## Capabilities

### New Capabilities
- `revenue-report`: Aggregating billed, collected, outstanding, and expense figures across buildings and months.

### Modified Capabilities
(none)

## Impact

- **Code**: new `backend/src/modules/reports/` (router, controller, service, schema). No changes to existing modules.
- **Database**: none. No schema change and no migration — the report reads `Invoice` and `Expense` as they already are.
- **API surface**: adds `GET /reports/revenue`, requiring an authenticated `owner`.
- **Response shape**: deliberately **not** the shared paginated envelope every list endpoint uses. A report is an aggregate rather than a list, so `{ data, meta }` would misrepresent it. Called out here so the difference reads as a decision.
- **Dependencies**: none.
- **Out of scope**: no cash-flow view. `Invoice.paidAt` is recorded but unused by this report, because "money that arrived in May" is a different question from "what May earned" and mixing them into one set of columns would make `outstanding` meaningless. That view can be added later as its own endpoint. Also out of scope: room-level breakdowns, per-tenant statements, exports, and any charting or presentation concern.
