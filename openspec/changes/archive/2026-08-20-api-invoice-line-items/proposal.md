## Why

An invoice records its charges as three fixed columns: rent, electricity, water. That works only while there are exactly three, and there are about to be more — a building's service fees vary per lease, so one tenant's bill has three charges and another's has seven.

A single combined "service fees" column would keep the total correct and make the bill useless: a tenant handed a figure of 300,000 cannot see whether it is parking, internet, rubbish, or a mistake. The invoice capability already promises that the charges on a bill visibly add up to its total, and a column that hides four charges inside one breaks that promise while technically satisfying it.

This change moves each charge onto its own row. It changes nothing about what anyone is charged — every invoice generated afterwards produces the same total, from the same inputs, as it did before. That is the point: doing it separately means the next change, which does alter what people pay, starts from a structure that has already been proved not to have moved any money.

## What Changes

- Add an invoice line item: a charge with a kind, a description, an optional quantity and unit amount, and an amount.
- Move rent, electricity, and water onto line items, and remove the fixed per-charge columns along with the rate inputs they were computed from — the rate becomes the line's unit amount, the occupant count becomes the water line's quantity. Nothing stops being reported; it is reported on the charge it belongs to.
- Keep `totalAmount` on the invoice as the stored sum of its lines, written with them and never independently.
- Keep the meter readings, the period, and the payment fields on the invoice. They describe the invoice, not any one charge — and the electricity chain between invoices reads the closing reading directly.
- **No change to what is charged.** Same inputs, same rounding, same total, same proration.

Deliberately out of scope:

- **Service fee lines.** The tables exist but nothing bills them yet, and adding them here would mean this change could no longer be verified by "every total is identical".
- **Invoice types, advance rent, deposits.** The billing change owns all of it.
- **Any change to the revenue report.** It reads `totalAmount` and nothing else, so it must keep working untouched — that is a check on this change rather than work in it.

## Capabilities

### Modified Capabilities

- `invoice`: charges are recorded as line items rather than fixed fields, and an invoice's total is required to equal the sum of them. What is charged, and how it is calculated, is unchanged.

### New Capabilities

None.

## Impact

**Database.** One new table, `InvoiceLineItem`. Seven columns removed from `Invoice`: three charge amounts and four calculation inputs. Existing invoices must be converted into lines by the migration rather than losing their detail.

**Code.** Invoice generation writes lines instead of columns; the response reports lines. The charge calculation itself is not touched — the same function produces the same figures, and they are simply stored differently.

**Unchanged, and verified as such.** The revenue report reads only `totalAmount`. The electricity chain reads only `currentElectricityUse`. Move-out validation reads only `currentElectricityUse`. All three keep working with no edit, and confirming that is part of the work.

**Existing data.** The development database holds no invoices, so the conversion is presently a no-op. It is still written to convert correctly, because a migration has to be right wherever it runs, and this is the cheapest moment this change will ever be.

**Downstream.** Required by the billing change, which adds service fee lines, deposit lines, and invoice types onto a structure that can hold them.
