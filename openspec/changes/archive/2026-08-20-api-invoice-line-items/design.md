## Context

See proposal.md — Why. What constrains the approach, all checked against the code rather than assumed:

- The revenue report reads exactly one column of `Invoice`: `totalAmount`. Nothing else.
- The electricity chain — both the next invoice's opening reading and move-out validation — reads exactly one column: `currentElectricityUse`.
- `computeCharges` already produces the three amounts from rates, counts, and an occupied period. It is not the thing being changed; only where its output is written.
- `Expense` already models a charge as `quantity × unitRate → amount`, with a stored amount and the note that where both inputs are present the amount is computed from them. A line item is that shape with a description.
- The development database holds no invoices.

## Goals / Non-Goals

**Goals:**

- Let an invoice carry however many charges it has.
- Change the shape without changing a single figure, and be able to demonstrate that.

**Non-Goals:**

- Service fee lines, invoice types, advance rent, deposits. All the billing change.
- Touching `computeCharges`. Same function, same output.
- Touching the revenue report. If it needs an edit, something has gone wrong — see below.

## Decisions

### The revenue report and the meter chain are checks, not work

Both read a single column each, and both columns stay. So neither should need editing, and **needing to edit either is evidence the change went wrong** rather than a task to complete.

This is stated as a decision because it is the cheapest available proof that the shape moved and the money did not. A refactor that has to adjust its consumers has changed something about them; one that does not has changed only what it claimed to.

### `totalAmount` stays stored, and is written with its lines

Keeping it contradicts the principle applied elsewhere in this project — that a derived value should be derived, not stored, so it cannot disagree with what it comes from. `depositAmount` and a lease service fee's monthly amount are both computed on read for exactly that reason.

It is kept anyway, for two reasons that do not apply to those:

1. The revenue report aggregates across many invoices. Deriving the total would turn every report into a join and sum over line items, to produce a number that is fixed the moment the invoice is written and never changes again.
2. It is already the contract. Callers read `totalAmount`, and removing it to protect an invariant that can be protected another way would break them for nothing.

The disagreement risk is closed by never letting the two be written apart: lines and total are created in one transaction, and no operation updates a total afterwards. Rounding happens per line and the total is their sum, which is what makes a bill add up on the page.

### Charge inputs move onto the line they produced, and are not duplicated

`electricityRate`, `waterRatePerPerson`, `baseRent`, and `occupantCount` are removed from `Invoice`. Each becomes a line's `unitAmount` or `quantity`:

```
  electricity   quantity = units consumed     unitAmount = electricity rate
  water         quantity = occupant count     unitAmount = per-person rate
  rent          quantity = (none)             unitAmount = the lease's agreed rent
```

Keeping them on the invoice as well would leave two places recording one fact, and the spec requirement that an issued invoice reports the rate that applied would then have two answers.

Rent takes no quantity. The alternative is a fabricated quantity of one, which reads as information and is not.

### A prorated line keeps the full-month basis, and lets the period explain the reduction

Proration breaks `amount = quantity × unitAmount`: seventeen days of a 3,000,000 rent is 1,645,161, which is not a whole-number multiple of anything worth recording.

The options were to make the quantity a fraction, to store a proration factor on the line, or to leave the basis alone and let the invoice's period account for the difference. The third is chosen: the invoice already records `periodStart`, `periodEnd`, and the month it covers, so the reduction is already explained by data the reader has. The other two either lose the rate — a quantity of 0.548387 tells nobody the rent is 3,000,000 — or add a field that duplicates what the period already says.

So the invariant is conditional and stated as such in the spec: for a full month, amount equals quantity times unit amount; for a partial one, it is that product reduced by the days occupied.

### The migration converts existing invoices rather than dropping their detail

There are no invoices to convert today, which makes the conversion untestable against real data and easy to skip. It is written anyway, because a migration that quietly discards charge history on a database that does have invoices is the kind of failure nobody notices until the history is wanted.

Written as: create the table, insert three lines per existing invoice from the columns about to be removed, then drop the columns. In that order, so nothing is dropped before it has been copied.

## Risks / Trade-offs

- **A stored total can disagree with its lines.** → Mitigated structurally: written in one transaction, never updated independently. The billing change will add lines to invoices and must preserve this; it is worth restating there rather than assuming it carries.

- **The conversion is exercised against zero rows.** Correct-looking SQL that has never converted anything is not proven SQL. → Verify it by inserting invoices in the old shape before migrating, or by checking the conversion against invoices created and compared before and after. Say plainly which was done rather than implying real data was involved.

- **Removing columns is a breaking response change.** Callers reading `invoice.rentAmount` stop finding it. → No frontend consumes invoices yet, so the exposure is nil today and will not be nil later. Doing it now is the point of doing it now.

- **"Same total as before" is only a real check if it is actually measured.** It is easy to assert and easy to skip. → The verification computes totals from the same inputs before and after and compares them, rather than checking that a total exists and looks plausible.
