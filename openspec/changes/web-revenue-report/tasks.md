# Tasks

## 1. Reading the report

- [x] 1.1 A range picker defaulting to the last six months, and a building filter. Opening empty would ask the reader to specify a question before the screen answers one.
- [x] 1.2 Per-building sections, always — even for a single building. A screen whose shape changes with the data rearranges itself the day an owner adds a second building.
- [x] 1.3 A monthly table carrying billed, settled, outstanding, spent and the two net figures.
- [x] 1.4 Keep billed, settled and outstanding adjacent and in that order. Their identity — billed = settled + outstanding — is the reader's only way to check the table against itself, and splitting them discards a free correctness check.
- [x] 1.5 Show a month with no activity as zeroes, never omitted. A gap reads as data that failed to load; a zero is a statement about the month.
- [x] 1.6 Render a negative net as a loss rather than clamping or hiding it. A report that cannot express a bad month is worse than one that says so bluntly.

## 2. The two figures that must not sit together

- [x] 2.1 Present money-ARRIVED in its own section, never as a column beside settled. An invoice issued in March and paid in May sits in March's settled and May's arrived; adjacent, they read as a discrepancy, and a reader who spots one stops trusting the whole report rather than concluding they measure different things.
- [x] 2.2 Say on each what it counts — the month billed versus the month the money came in.
- [x] 2.3 Offer no arithmetic between them. There is no meaningful difference between an accrual figure and a cash figure over the same month.

## 3. The breakdowns

- [x] 3.1 Costs by kind, summing to what was spent.
- [x] 3.2 Owner-named charges by kind, rendered INSIDE what was billed and labelled as a part of it. Beside the billed figure, a reader adds the two and counts the same money twice — one heading's worth of care preventing exactly the error the API's shape was designed to prevent.

## 4. Leading somewhere

- [x] 4.1 Link the outstanding figure to the unpaid bills on the invoices screen. "Who has not paid" is the next question, and the filter already exists.
- [x] 4.2 Offer nothing where nothing is outstanding.
- [x] 4.3 Route and navigation entry, replacing the last placeholder.
- [x] 4.4 Usable on a phone — six figures per month do not fit a narrow screen as a table.
- [x] 4.5 Typecheck and build the frontend.

## 5. Verification

- [x] 5.1 Build a month whose numbers are known in advance: a paid invoice, an unpaid one, and a recorded cost. **Check every figure on the screen against the arithmetic**, not against the API echoing itself.
- [x] 5.2 **billed = settled + outstanding** holds in the rendered table.
- [x] 5.3 A payment dated in a DIFFERENT month from its invoice: confirm settled and arrived land in different months, and that the screen presents that as two facts rather than a discrepancy.
- [x] 5.4 A month with no activity inside the range renders as zeroes.
- [x] 5.5 A loss-making month renders as a negative net.
- [x] 5.6 Costs by kind sum to the spent figure; charges by kind are shown as part of billed and not added to it.
- [x] 5.7 The outstanding link reaches the unpaid bills, and is absent when nothing is outstanding.
- [x] 5.8 Two buildings: reported separately, with a grand total.
- [x] 5.9 **Nothing already correct changed**: invoices, expenses and their month-end rounds behave as they did.
- [x] 5.10 On the screen at phone width.
- [x] 5.11 Remove the verification data.
