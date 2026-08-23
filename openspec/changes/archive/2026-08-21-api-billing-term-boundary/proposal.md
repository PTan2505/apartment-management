## Why

A lease has two dates that end it, and the system reads them by opposite rules.

`expectedEndDate` is derived for display and read nowhere else, so nobody has had to say which side of it a tenancy falls on. `moveOutDate` is read everywhere and treated as the last day occupied — billing counts it, so a move-out on the 5th charges the 5th.

Neither is written down as a rule, and the gap between them shows up the moment a tenant renews. A tenancy recorded as ending on 5 July, followed by a new lease beginning 5 July, bills that day twice. Getting it right requires knowing that one date is inclusive and the other is not, which is exactly the kind of thing nobody remembers.

There is a second problem behind the same function. `resolveOccupiedPeriod` decides which days of a month a tenancy covers from the lease start and the move-out date. It has never been told the agreed duration. So a lease with no move-out recorded is treated as running forever, and an invoice can be generated for its seventh month, its twentieth, its hundredth — no error, no warning, a plausible-looking bill at the end of it.

This change gives every ending date one rule, and makes the agreed term bound a lease nobody has closed.

## What Changes

- **Establish one rule: an ending date is the first day no longer covered.** It applies to both `expectedEndDate` and `moveOutDate`, so a reader never has to remember which is which.
- **BREAKING (behaviour):** a move-out is billed up to the day *before* the recorded date, not through it. A tenancy recorded as ending 5 July covers through 4 July.
- A renewal therefore begins on exactly the date the previous lease ended, with no day billed twice and none left uncovered — the same way a renewal already abuts an expected end date.
- **BREAKING (behaviour):** for a lease with no move-out recorded, refuse to generate an invoice for a month falling entirely beyond the agreed term, and bound the final month's charges at the term rather than at the end of the calendar month.
- Leave a lease that *has* recorded a move-out bounded by that date, including a date past the term. The owner records when the tenant actually left, and what to charge for days beyond the term is their judgement.
- Correct the vacancy-expense check, which asks whether a tenancy was live at month end and assumes the old inclusive reading. One rule means one rule everywhere.

Deliberately out of scope:

- **Any limit on the move-out date.** An owner records the real date, however late. A tenant who stays a few days past the term with neither side wanting a renewal is ordinary, and forcing a date that did not happen would put a lie in the record to satisfy a rule.
- **What is charged for days past the term.** Electricity settles itself — metered, so the handover reading already covers those days and cannot be split without a second reading nobody takes. For everything else the owner decides, and that belongs to the change that owns the final invoice.
- **Advance rent, invoice types, deposits, service fees.** All the billing change.
- **Preventing overlapping leases on one room.** Creating a lease is refused only when another has no move-out recorded, so two finalized leases may cover the same days. Pre-existing, unrelated to the rule being fixed here, and worth its own change.
- **Surfacing leases that expired without a move-out.** This change creates that state; finding them is a listing concern.

## Capabilities

### Modified Capabilities

- `lease`: both ending dates are defined as exclusive — the last day covered is the day before.
- `invoice`: a move-out is billed to the day before it, and a lease with no recorded move-out is billable only within its agreed term.
- `expense`: whether a tenancy was live at month end follows the same exclusive reading.

### New Capabilities

None.

## Impact

**Database.** None. No column changes, no migration.

**Code.** The function resolving a month's occupied period gains the term as a bound and reads both ending dates the same way. The vacancy-expense check shifts by one day. Small, and in the paths that decide what a tenant is charged.

**Existing invoices.** Untouched. This governs which invoices may be created and what period they cover, not what an issued one says.

**Behaviour that changes.** Three things, all corrections. A recorded move-out bills one day fewer, because that day belongs to whatever follows. Months beyond the term stop being billable on an unclosed lease. The final month of an unclosed lease is charged to the term rather than whole.

**Downstream.** The billing change depends on this. Rent paid in advance needs a defined last rentable month, and "the final invoice carries no rent" needs a defined final.
