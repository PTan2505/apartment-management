## Why

The interface is Vietnamese and the invoice screen is not — not its frame, which was translated, but its **contents**, which are the part an owner actually reads:

```
Rent 2026-08          3.000.000 ₫
Electricity 80 kWh      280.000 ₫
Water, 2 occupant(s)    200.000 ₫
```

Those strings are written by the backend when the invoice is issued and stored on the row. They are the most-read text in the application — a bill is opened to answer a tenant's question about one line of it — and they sit in the middle of an otherwise Vietnamese screen.

Translating them at the source was the obvious fix and was rejected: the description is frozen at issue time deliberately, because it records what was charged. Changing the generator would leave every existing invoice in English while new ones came out Vietnamese, and rewriting the old ones would edit a historical record to make it read better.

So the screen renders these lines itself, from data the row already carries. Nothing stored changes, and an invoice issued last year reads the same as one issued today.

## What Changes

- **Lines the system computed are labelled by the screen** — rent, electricity, water — built from the line's kind, quantity and period, all of which are already on the row. The stored description carries nothing these do not.
- **Lines a person wrote are shown exactly as written.** A service fee carries the name the owner gave it in the building's catalogue; an ad-hoc charge carries what the owner typed about a broken window. Translating either would be rewriting somebody's own words, and the owner may well have written them in Vietnamese already.
- **Deposit lines keep their distinctions.** There are four of them — the deposit charged at move-in, a top-up at renewal, an amount handed back at renewal, and an amount kept at a cancellation — and they are not interchangeable: one of them is a negative figure. They are recognised and named individually rather than collapsed into one word.
- **Anything unrecognised is shown as stored.** The failure is then an English line on a Vietnamese screen, which is exactly today's behaviour, rather than a line labelled wrongly.

Deliberately NOT in this change:

- **Changing what the backend writes.** The stored description stays as the record of what was charged.
- **Rewriting existing invoices.**
- **The tenant portal**, which reads the same descriptions and is already Vietnamese around them. Worth doing, and a separate decision about a screen a tenant sees.

## Capabilities

### Modified Capabilities

- `web-invoices`: a bill's charges are labelled in the reader's language, without altering what was recorded.

## Impact

- `frontend/src/features/invoices/` — the labelling, and the invoice detail that uses it.
- No backend change. No data change. No change to any figure.
