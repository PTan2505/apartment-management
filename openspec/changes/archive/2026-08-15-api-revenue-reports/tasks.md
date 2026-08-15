## 1. Branch & module scaffolding

- [x] 1.1 Create feature branch `feature/api-revenue-reports` off `dev`
- [x] 1.2 Create `backend/src/modules/reports/` with `schema.ts`, `service.ts`, `controller.ts`, `router.ts`
- [x] 1.3 Add a zod query schema for `from`, `to` (year-month), and optional `buildingIds`, rejecting a start month after the end month
- [x] 1.4 Mount the reports router in `backend/src/server.ts` under `/reports`, guarded by `authenticate` + `requireRole("owner")`

## 2. Aggregation

- [x] 2.1 Implement the month grid: enumerate every month from the start to the end of the range inclusively
- [x] 2.2 Implement the invoice aggregation grouped by building, year, and month, joining through lease and room, excluding voided invoices
- [x] 2.3 Split invoice sums into billed, collected (paid), and outstanding (pending), summing outstanding directly rather than subtracting
- [x] 2.4 Implement the expense aggregation grouped by building and the month of `incurredAt`, including both building-level and room-level expenses
- [x] 2.5 Implement the per-category expense aggregation for building totals and the grand total
- [x] 2.6 Resolve the building selection: named buildings, or every building including retired ones when none are named; return 404 for an unknown id

## 3. Assembly

- [x] 3.1 Merge invoice and expense aggregates onto the month grid, filling absent months and buildings with zeros
- [x] 3.2 Compute `netBilled` (billed − expenses) and `netCollected` (collected − expenses) per month, allowing negative values
- [x] 3.3 Compute per-building totals across the range, including the per-category expense breakdown
- [x] 3.4 Compute the grand total across all selected buildings, including its per-category breakdown
- [x] 3.5 Return the report as a single aggregate structure, deliberately not the paginated envelope

## 4. Verification — range and selection

- [x] 4.1 Verify a multi-month range returns a row for every month between the endpoints inclusively
- [x] 4.2 Verify a single-month range returns exactly that month
- [x] 4.3 Verify a start month after the end month returns 400
- [x] 4.4 Verify naming specific buildings limits the report to them
- [x] 4.5 Verify omitting building ids covers every building, including a retired one with historical activity
- [x] 4.6 Verify an unknown building id returns 404
- [x] 4.7 Verify the endpoint returns 401 unauthenticated and 403 for a non-owner role

## 5. Verification — figures

- [x] 5.1 Verify billed equals collected plus outstanding exactly, for a month holding both paid and unpaid invoices
- [x] 5.2 Verify a fully paid month reports collected equal to billed and outstanding zero
- [x] 5.3 Verify an entirely unpaid month reports outstanding equal to billed and collected zero
- [x] 5.4 Verify an invoice paid in a later month counts toward the month it covers, not the month it was paid
- [x] 5.5 Verify voided invoices contribute to no figure
- [x] 5.6 Verify expenses fall in the month of their incurred date
- [x] 5.7 Verify room-level and building-level expenses both count toward their building
- [x] 5.8 Verify `netBilled` and `netCollected` are both reported and computed from the right bases
- [x] 5.9 Verify a month whose expenses exceed collections reports a negative `netCollected` rather than zero

## 6. Verification — shape

- [x] 6.1 Verify a month with no activity appears with every figure zero
- [x] 6.2 Verify a named building with no activity in the range appears with zeros throughout
- [x] 6.3 Verify each building's total equals the sum of its monthly rows
- [x] 6.4 Verify the grand total equals the sum of the building totals
- [x] 6.5 Verify the per-category expense breakdown appears on building totals and the grand total, and that its amounts sum to the expense total
- [x] 6.6 Verify the response carries no pagination metadata

## 7. Wrap-up

- [x] 7.1 Run `tsc --noEmit` and confirm it passes
- [x] 7.2 Confirm all new imports follow the `@/` alias convention
- [x] 7.3 Clean up verification data, leaving the seeded owner intact
- [x] 7.4 Commit work in atomic commits per completed task group, on `feature/api-revenue-reports`
