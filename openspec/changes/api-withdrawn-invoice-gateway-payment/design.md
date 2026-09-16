## Context

- `voidInvoice` writes `voidedAt` and `voidReason` and nothing else. Pending gateway payments on the invoice are untouched.
- `applyWebhook` verifies the signature, finds the payment by `gatewayOrderCode`, ignores it unless `state === "pending"`, checks the amount, and calls `settle`.
- `settle` — shared with `reuseOrRetire`'s "the gateway says PAID" branch — holds the invoice's deposit, marks the payment succeeded and the invoice paid, in one transaction. It never reads `voidedAt`.
- `reversePayment` always calls `releaseFromInvoice`, restores a deduction where the method was one, marks the payment reversed, and recomputes `paymentStatus`.
- The revenue report's cash query already filters `invoice: { voidedAt: null }`.
- `payos.ts` can create and fetch a link. PayOS documents `POST /v2/payment-requests/{orderCode}/cancel` with `{ cancellationReason }`, refusing links that are already paid.
- The gateway is configured locally.

## Goals / Non-Goals

**Goals.** No withdrawn invoice can become paid through the gateway. Money that arrives for one is recorded and flagged. Returning it cannot corrupt the deposit holding. Pending links are cancelled on withdrawal.

**Non-Goals.** Applying money to a replacement invoice. Changing the tenancies "Cần xử lý" toggle. Retiring links on invoices withdrawn before this change. Any migration.

## Decisions

### The invariant that removes the need for a new column

A succeeded payment on a withdrawn invoice can only have arrived after withdrawal:

- `voidInvoice` refuses an invoice whose `paymentStatus` is `paid`;
- `cancelLease` withdraws only invoices whose `paymentStatus` is `pending`;
- `paymentStatus` is `paid` whenever any payment on the invoice has succeeded.

So "invoice withdrawn AND payment succeeded" identifies money that landed after withdrawal, with nothing stored. Checked against the local data: the only payment on a withdrawn invoice is #63 on #390, pending. The invariant is written beside the code that relies on it, so a future path that withdraws a paid invoice has to confront it.

Timestamps were rejected as the marker: a tenant who pays just before the withdrawal has `paidAt` earlier than `voidedAt`, yet the money still arrives on a bill that was already withdrawn when it was recorded.

### One rule in `settle`, not two call sites

`settle` reads the invoice's `voidedAt` inside its transaction. Withdrawn → mark the payment succeeded with `paidAt` and the payload, and stop: no `holdFromInvoice`, no invoice update. Not withdrawn → exactly what it does today.

Both routes that learn of money — the webhook and `reuseOrRetire` — already call `settle`, so neither can forget. Reading `voidedAt` inside the transaction closes the gap where a withdrawal commits between the lookup and the write.

### The webhook accepts a retired payment when its invoice is withdrawn

Today a confirmation for a payment that is not `pending` changes nothing. That stays true for invoices that were not withdrawn. For a withdrawn invoice, a confirmation for a `pending`, `cancelled` or `expired` payment is passed to `settle` after the signature and amount checks. `succeeded` still changes nothing, which keeps a retried delivery harmless.

`cancelled` and `expired` are both accepted because money arriving is money arriving; the retired state only records that the system stopped expecting it.

### Withdrawal: local first, in one transaction; the gateway afterwards

`voidInvoice` becomes a transaction: write `voidedAt`/`voidReason`, and mark the invoice's `pending` gateway payments `cancelled`. Then, after commit, for each payment it retired, `retireLinkAtGateway`:

- `POST {BASE_URL}/{orderCode}/cancel` with a Vietnamese reason naming the withdrawal;
- refused → `fetchPaymentLink`; `PAID` → `settle`, which records it as landed on a withdrawn invoice;
- unreachable, not configured, or any other answer → logged without credentials, and the withdrawal stands.

The response to the owner is the withdrawn invoice either way. A slow gateway delays nothing it cannot undo, and the multi-write rule holds: each exported function either writes once or writes inside a transaction.

### Reversal branches on the invoice, once

`reversePayment` reads the invoice's `voidedAt`. Withdrawn → mark the payment reversed with `reversedAt`, and do nothing else. Not withdrawn → today's path unchanged. By the invariant the only payments reaching the withdrawn branch are money that landed after withdrawal, whose deposit was never held.

### The invoice reports it; screens do not derive it

Invoice responses gain `receivedAfterWithdrawal: number | null` — the sum of succeeded payments when `voidedAt` is set, otherwise null — computed in one mapper used by every place that returns an invoice. Following the rule to fix data shape at the source, the screens read the field rather than re-deriving it from payment states.

### Screens

- Invoice screen: its own error alert directly below the withdrawn notice — titled "Có tiền chuyển về sau khi hoá đơn đã bị thu hồi", reading "{tiền} đã về cho hoá đơn này sau khi thu hồi. Khoản này phải trả lại cho khách: đảo giao dịch ở mục Thanh toán bên dưới." — with the payment list already showing the reversal action. Changed during implementation from a line inside the withdrawn notice: that notice is history, and this is a task, so it gets its own severity.
- Invoice list and the tenancy's invoice panel: a warning chip "Có tiền cần trả lại" beside "Đã thu hồi".
- New strings are listed in tasks for the owner's review; existing strings are unchanged.

## Risks / Trade-offs

**The gateway cancel call is outward.** Verification uses the no-gateway path and locally signed webhooks, neither of which reaches PayOS. Calling the real cancel endpoint is done only with the owner's go-ahead, and on a link created for the purpose.

**#63 on #390 stays pending.** It is covered: if the gateway confirms it, `settle` records it as landed. Cancelling it at PayOS is left to the owner.

**The cash figure is lower than the bank statement** while such money is unreturned. Chosen by the owner; the flag is the counterweight.

**A future path that withdraws a paid invoice breaks the invariant.** Written at the point of use in `settle` and `reversePayment`, and in the invoice spec, so the break is visible in review.
