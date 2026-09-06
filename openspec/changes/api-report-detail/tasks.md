## 1. Counts beside the figures

- [ ] 1.1 Report, per building and month, how many rooms the figures cover, how many are collected and how many outstanding
- [ ] 1.2 Take the counts from the same grouped rows the sums come from — a separate `COUNT` over its own `WHERE` is how a count and a total come to disagree
- [ ] 1.3 Count a tenanted room with nothing billed in the month, so the count does not report fewer rooms let than are
- [ ] 1.4 Report how many expense records each expense total is made of
- [ ] 1.5 Confirm the collected and outstanding counts sum to the room count, the way the amounts already sum to what was billed

## 2. The rooms behind the figures

- [ ] 2.1 Add room-level detail per building and month: the room, its tenancy, the person responsible, and what was billed, collected and outstanding
- [ ] 2.2 Derive it from the SAME query that produces the month totals, grouped one level finer — never a second query written to look similar
- [ ] 2.3 Report a tenanted room with no billing as zeroes rather than omitting it
- [ ] 2.4 Report an absent tenant as absent rather than as an empty name
- [ ] 2.5 Do NOT break `received` down per room — a cash figure inside an accrual row reproduces, at a finer grain, exactly the confusion the report is designed to prevent

## 3. Asking for it

- [ ] 3.1 Make the detail opt-in through the existing report endpoint rather than a second endpoint that would repeat the range-and-building surface and drift from it
- [ ] 3.2 Default to off, so no screen starts paying for a room list on the strength of a deployment
- [ ] 3.3 Confirm a summary request returns exactly the shape it returns today, plus the counts

## 4. Verification

- [ ] 4.1 `tsc --noEmit` passes, and `npm run codes:check` still matches
- [ ] 4.2 `curl` the summary form and diff it against today's response — only the counts may be new
- [ ] 4.3 `curl` the detailed form and check, by adding them up, that the room figures sum EXACTLY to the month total they sit under
- [ ] 4.4 Do that check on a month containing a voided invoice, an ad-hoc invoice, and a lease with more than one invoice — the three cases where a second query would silently disagree
- [ ] 4.5 Check across two buildings with different rates, so a bug that reports one building's rooms under another cannot pass
- [ ] 4.6 Confirm the counts agree with the rows returned, by counting the rows
- [ ] 4.7 Failure paths: an unauthenticated request, and a range whose start is after its end
- [ ] 4.8 Confirm the revenue screen still renders unchanged against the new response, in a visible browser — this change touches what that screen reads, so `curl` is not enough
