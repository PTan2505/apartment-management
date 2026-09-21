## Why

A tenant can pay a bill the owner has already withdrawn, and the system then records the withdrawn bill as paid.

Withdrawing an invoice leaves any gateway payment on it pending: the QR code and checkout link the tenant already holds still work. When the gateway confirms, the webhook checks only that the payment is still pending and the amount matches, then settles — marking the invoice paid and moving any deposit it charged into the holding. It never looks at whether the invoice was withdrawn. A bill the owner took back becomes a paid bill, and the deposit ledger gains money for a charge that no longer exists.

This is not hypothetical. Invoice #390 (P101, October 2026) was withdrawn while carrying pending gateway payment #63.

Refunding it would then go wrong a second way. Reversing a payment always releases the deposit its invoice charged. For money that landed on a withdrawn move-in bill, that deposit was never held, so the refund is either refused with a message about a deposit already being spent, or it subtracts from a holding that belongs to something else.

## What Changes

- **Withdrawing an invoice retires its unfinished gateway payments.** They are marked cancelled in the same transaction as the withdrawal, and the gateway is asked to cancel each link afterwards, so the tenant's QR code stops working where the gateway allows it.
- **Money that arrives for a withdrawn invoice is recorded, and the bill stays withdrawn.** The payment becomes succeeded with the date the money arrived. The invoice is not marked paid and no deposit moves. This holds whether the confirmation arrives by webhook or is discovered when a lost confirmation is caught, and whether the payment was still pending or had been retired.
- **Returning that money leaves the deposit alone.** Reversing such a payment neither releases a holding nor changes the invoice's payment status.
- **The invoice says money arrived after it was withdrawn**, and the screens show it with the way to return it, so it is never left unnoticed.
- **The revenue report keeps that money out of the cash figure**, as it already does for every payment on a withdrawn invoice — now stated as a requirement rather than a side effect of a filter.

## Decisions taken with the owner

- Money that lands on a withdrawn bill is **recorded, and the bill stays withdrawn** — not refused, and not silently un-withdrawn.
- Withdrawing a bill **cancels its pending gateway link**.
- That money is **not counted in "Tiền thực nhận"** until the owner returns it; it is flagged instead.

## Deliberately not built

**Applying the money to a replacement invoice.** Moving a payment from one invoice to another is a new operation with its own rules. The owner returns the money with the existing reversal; applying it elsewhere is left for its own change.

**Adding this to the tenancies "Cần xử lý" toggle.** That toggle means a tenancy whose term ran out. Mixing a second meaning into it changes what it reports; surfacing money-after-withdrawal there is a separate decision.

**Retiring links on invoices withdrawn before this change.** #63 on #390 stays pending in the database. It no longer matters for correctness — if money arrives for it, it is recorded as landing on a withdrawn bill — and cancelling it at the gateway is an outward call the owner decides on.

## Capabilities

### Modified Capabilities

- `invoice`: withdrawing retires unfinished gateway payments; an invoice reports money received after it was withdrawn.
- `payment-gateway`: a confirmation for a withdrawn invoice records the money without settling the bill.
- `payment`: reversing money that arrived for a withdrawn invoice does not touch the deposit.
- `revenue-report`: money received for a withdrawn invoice stays out of the cash figure.
- `web-invoices`: the invoice screens show money received after withdrawal and how to return it.

## Impact

- `backend/src/modules/invoices/` — withdrawal, and the invoice response.
- `backend/src/modules/payment-gateway/` — `settle`, the webhook, and a new cancel call in `payos.ts`.
- `backend/src/modules/payments/` — reversal.
- `frontend/src/features/invoices/` and the tenancy's invoice panel — the flag.
- No migration: a succeeded payment on a withdrawn invoice can only have arrived after withdrawal, because withdrawal is refused while an invoice is paid and a cancelled tenancy withdraws only unpaid invoices.
