# Tasks

## 1. Capture what changes

- [x] 1.1 Before touching anything, generate an invoice for the final month of a lease whose term ends partway through it, with no move-out recorded, and record the figures. Today it charges a whole month; afterwards it should charge to the term end.
- [x] 1.2 Record that an invoice can currently be generated for a month well past the term on an unclosed lease — the bug being fixed.
- [x] 1.3 Record what a recorded move-out currently bills, so the one-day reduction is measured rather than described. **Captured**: move-out 2026-05-10 billed 05-01…05-10, ten days, rent 967,742.

## 2. One rule for ending dates

- [x] 2.1 Read both ending dates the same way: the last covered day is one day before `moveOutDate ?? expectedEndDate`. The asymmetry belongs in *which* date is chosen, not in how each is read.
- [x] 2.2 Correct the vacancy-expense check in `modules/expenses/`, which asks whether a tenancy was live at month end and assumes the inclusive reading. A lease ending on the month's last day did not cover it.
- [x] 2.3 Confirm no other reader of `moveOutDate` assumes the inclusive reading. Search rather than assume — the occupant `leftAt` write and the active-lease guards each need checking.

## 3. The term bound

- [x] 3.1 Give `resolveOccupiedPeriod` the lease's term end, so the wrong answer is unreachable from any caller rather than being prevented by each one separately.
- [x] 3.2 Apply the bound only when no move-out is recorded. A recorded move-out is a fact and bounds the period by itself, including when it falls past the term.
- [x] 3.3 Treat the expected end date as exclusive. Check against `addMonths`, which clamps 31 January + 1 month to 28 February.
- [x] 3.4 Confirm a month entirely outside the bound still yields no period, so the existing 400 and its message continue to apply.
- [x] 3.5 Update the comment on `resolveOccupiedPeriod` so it states the single rule for ending dates, not only the term bound.

## 4. Leave move-out validation alone

- [x] 4.1 Make no change to move-out validation. The date is deliberately unconstrained.
- [x] 4.2 Run `tsc --noEmit`.

## 5. Verification: the term bound

Re-run after the convention change. These were verified against the earlier behaviour and no longer stand on their own.

- [x] 5.1 Seed a lease beginning 2026-01-01 for six months, so its expected end date is 2026-07-01.
- [x] 5.2 Invoicing a month wholly inside the term is unchanged and charges in full.
- [x] 5.3 Invoicing the month a term ends partway through charges to the term end, not the whole month. Compare against the task 1.1 baseline.
- [x] 5.4 Invoicing July on the unclosed lease returns 400 — the bug from task 1.2, fixed.
- [x] 5.5 Invoicing a month long after the term also returns 400.
- [x] 5.6 Invoicing a month before the lease began returns 400.
- [x] 5.7 A lease beginning 2026-01-31 for one month has an expected end date of 2026-02-28 and is billable through 2026-02-27.
- [x] 5.8 A move-out dated after the term is accepted — the date is deliberately unconstrained.
- [x] 5.9 With that late move-out recorded, invoicing that month is no longer refused.
- [x] 5.10 Existing move-out validations still reject their own cases — a date before the start, a reading below the lease's opening, a reading below the last invoiced.
- [x] 5.11 The revenue report and the electricity chain still work.
- [x] 5.12 Re-check the overlapping-lease finding from the earlier pass: a predecessor with a move-out past its term, renewed at the term end, still overlaps. Confirm it remains pre-existing and unaffected rather than assuming the earlier conclusion still holds. **Re-checked**: still overlaps (predecessor billed 07-01…07-04, renewal from 07-01). Unchanged by this work — lease creation is refused only when another lease has no move-out recorded.

## 6. Verification: the exclusive move-out

- [x] 6.1 A move-out dated 2026-05-10 bills 2026-05-01 … 2026-05-09 — nine days, not ten. Compare against the task 1.3 baseline and state the difference in figures.
- [x] 6.2 A renewal beginning on exactly that move-out date bills from 2026-05-10, so no day is billed twice and none skipped. This is the case that prompted the change. **Result**: predecessor 05-01…05-09 (870,968) + renewal 05-10…05-31 (2,129,032) = 3,000,000, exactly one full month, no gap, no overlap, no rounding drift.
- [x] 6.3 A move-out dated the first of a month yields no invoice for that month.
- [x] 6.4 A vacancy expense is accepted for a room whose lease recorded a move-out on the last day of that month — it did not cover that day.
- [x] 6.5 A vacancy expense is still refused for a room whose lease covered the month's last day.
- [x] 6.6 Remove the verification data, leaving the database as it was found.
