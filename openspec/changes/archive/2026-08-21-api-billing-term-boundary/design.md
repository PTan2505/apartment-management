## Context

See proposal.md — Why. What shapes the approach, checked rather than assumed:

- `expectedEndDate` is computed in the lease mapper and read **nowhere else**. This change gives it meaning for the first time, so there is no existing behaviour to preserve or contradict.
- `resolveOccupiedPeriod(year, month, leaseStart, moveOutDate)` clamps the month to `[leaseStart, moveOutDate ?? monthEnd]`. The duration is not among its arguments, which is exactly why an unclosed lease bills forever.
- `addMonths` clamps to the last valid day of the target month — 31 January plus one month is 28 February, not 3 March. Relied on here, unchanged.
- The proration path counts both endpoints inclusively: the 16th to the 31st is sixteen days.
- Electricity is never prorated. It is `(closing − opening) × rate`, so the reading taken at handover already covers whatever days it covers.

## Goals / Non-Goals

**Goals:**

- Stop an unclosed lease being billable without limit.
- Fix in writing which side of the expected end date the tenancy falls on, now that money depends on it.

**Non-Goals:**

- Constraining the move-out date. Explicitly rejected — see below.
- Deciding what is charged for days past the term. The billing change.
- Advance rent, invoice types, deposits, service fees.
- Listing leases that expired without a move-out. This change creates that state; finding them is separate.

## Decisions

### The bound applies only when no move-out is recorded

This is the decision that shrank the change, and it turns on what an absent move-out means.

A recorded move-out is a fact: someone confirmed the tenant left on that date, and the dates can be trusted even when they run past the term. An **absent** move-out is not the fact that the tenant is still there — it is the absence of any record at all. Billing against it invents occupancy.

So the term bounds the first case and nothing bounds the second beyond the recorded date. This also puts the pressure in the right place: an owner who reaches the end of a term and finds billing refused must either record the departure or create a renewal, which are the two things that were actually supposed to happen.

**Alternative considered:** bounding every lease at the term, including those with a recorded late move-out. Rejected because it would refuse to bill days a tenant demonstrably occupied, and because forcing the owner to record a date that did not happen puts a lie in the record to satisfy a rule.

### The move-out date is left unconstrained

An earlier draft of this change rejected a move-out on or after the expected end date. That was wrong, and the case that broke it is ordinary: a tenant stays a few days past the term, neither side wants a renewal, and the handover happens on the 5th.

Under the rejected rule the owner had to write 30 June. The record would then say the tenancy ended on a day it did not, and the meter reading — taken on the 5th — would be attached to the wrong date.

Electricity settles part of this on its own. It is metered rather than prorated, so the closing reading already includes those days and could not be split without a second reading nobody takes. Capping water and service fees at the term while electricity ran to handover would leave one invoice charging two different end dates, which is the kind of inconsistency that is impossible to explain to a tenant.

What *is* charged for those days is a judgement — the owner may waive it, charge utilities only, or charge everything — and judgements belong to whoever owns the final invoice. That is the billing change, not this one.

### One rule for every ending date

A date that ends a tenancy is the first day it no longer covers. Both `expectedEndDate` and `moveOutDate` obey it.

This started as a decision about `expectedEndDate` alone, and that was a mistake — it would have left the system with two ending dates read by opposite rules, which is how off-by-one bugs become permanent. The case that exposed it: a tenancy recorded as ending 5 July, renewed by a lease beginning 5 July, bills that day twice. Under one rule the renewal simply begins on the date the previous tenancy ended, which is what the words already mean.

Making `moveOutDate` exclusive changes existing behaviour: a move-out on the 5th now bills through the 4th, one day fewer than before. That is the correction — the 5th belongs to whatever comes next, whether that is a renewal or a vacancy.

It also reaches the vacancy-expense check, which asks whether a tenancy was live at a month's end and was written against the inclusive reading. A lease ending on the last day of the month did not cover that day, so the room was vacant for it. Fixing that is not scope creep: leaving it would mean the rule holds in billing and not in expenses, which is worse than having no rule.

**Implementation consequence worth noting:** with both dates exclusive, the ending boundary collapses to `moveOutDate ?? expectedEndDate` and the last covered day is one day before it. The asymmetry lives entirely in *which* date is chosen, not in how each is read.

### Why exclusive rather than inclusive

A six-month lease from 1 January ends on 1 July and the tenant occupies through 30 June.

The alternative reads more naturally off the field name and is wrong in consequence. Because periods count endpoints inclusively, an inclusive end date would make a six-month lease bill a **single day of a seventh month**: one invoice, one rent line, `3,000,000 × 1/31`. Every renewal would also have to begin the day after, so "the new lease starts when the old one ends" would produce an overlapping day.

Exclusive removes both. A renewal beginning on the previous term's end date abuts it exactly, which is what that phrase already means to a person.

The month-end case behaves correctly too: 31 January plus one month gives 28 February, so the tenancy is 31 January through 27 February — 28 days for a one-month term that began on the last day of a longer month.

**Recorded because it is not self-evident:** the field name suggests the opposite, so the spec states which side it falls on rather than leaving it to be inferred from arithmetic.

### The bound goes into `resolveOccupiedPeriod`, not its callers

The function exists to answer "which days of this month did this tenancy cover". The agreed term is part of that answer and was simply missing from its inputs.

Checking in the caller instead would leave the function still able to return a period past the term, so the next caller written would reinherit the bug. Passing the term in makes the wrong answer unreachable.

## Risks / Trade-offs

- **An unclosed lease past its term becomes stuck.** The room stays held by the one-active-lease rule while no further invoice can be issued. → Created here and named in the proposal as out of scope. This is also the intended pressure: the owner must record the departure or renew. But they need a way to *find* such leases, and that is a listing feature — bundling it here would mix a correctness fix with a convenience one.

- **The last month of an unclosed lease is now prorated where it was charged whole.** An owner used to a full final month will see less. → This is the correction, not a regression: those days were never agreed. Stated in the summary so it does not read as a bug when first observed.

- **A move-out dated on the lease start date now covers zero days.** Under the old reading it covered one. → Coherent: the tenancy ended before it began, so no month yields a period and no invoice can be generated. Left as-is rather than newly rejected, because refusing it is a separate judgement about whether such a record should exist at all.

- **A late move-out still bills the old rules until the billing change lands.** With a move-out recorded past the term, the current code will prorate rent and water to that date automatically — no owner choice yet. → Accepted as the interim state. It is current behaviour, not something this change introduces, and the alternative is smuggling the owner-choice mechanism into a change that has no invoice types to hang it on.
