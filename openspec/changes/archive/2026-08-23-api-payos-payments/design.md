## Context

See proposal.md — Why. What shapes the approach, read from the code and from the provider's documentation rather than assumed:

- `Payment` already carries an amount, a method, a date, a state and a reversal. It has `succeeded` and `reversed`, and its `paidAt` is **not nullable**.
- The revenue report's `received` loop adds every payment whose `paidAt` falls in range and asks nothing about its state. Correct today, because both existing states belong there.
- `Payment.id` is a serial integer, one per attempt.
- The portal resolves what a token may see from `LeaseOccupant`, and is read-only. It has no write endpoint.
- `requestLogger` redacts `authorization`, `cookie` and `set-cookie` — added last change. Nothing else is redacted.
- `env.ts` fails fast, with `OPENMAP_API_KEY` as the precedent for an optional credential and its reasoning written where it lives.

From the provider's documentation ([API](https://payos.vn/docs/api/), [signature](https://payos.vn/docs/tich-hop-webhook/kiem-tra-du-lieu-voi-signature/)):

- A payment request takes an integer `orderCode` the merchant chooses and which must be unique, an integer `amount`, a `description`, return and cancel URLs, and a signature over those fields sorted alphabetically.
- `description` is limited to **9 characters** for accounts not linked to a payOS bank account. Short enough to change what is possible.
- A confirmation arrives as `{ code, desc, success, data, signature }`, where the signature is HMAC-SHA256 over the fields of `data` sorted alphabetically and joined as `key=value&…`, with absent values as empty strings.
- The webhook URL must be registered with the provider, which calls it to verify it before sending live confirmations.

## Goals / Non-Goals

**Goals:**

- Let a tenant pay a bill they can already see.
- Believe a confirmation only after proving it came from the gateway and matches the bill.
- Keep money that arrives in the record, including money that arrives twice.

**Non-Goals:**

- Refunding through the gateway. A reversal records that money went back; how it went back is the owner's business.
- Partial payment, still. Nothing here divides an amount.
- Paying several bills in one transaction.
- Resolving a disagreement with the gateway automatically.
- Any provider but this one. A second would justify an abstraction; one does not.

## Decisions

### `orderCode` is the payment's own id, never the invoice's

The gateway wants a unique integer. `Payment.id` is one, and there is exactly one per attempt.

Using the invoice's id breaks on the second attempt: a link that expires and is replaced would reuse a reference the gateway has already seen, and a confirmation arriving for either would be indistinguishable. Using a random number would need a uniqueness check and a column to hold it.

That `Payment.id` fits is a consequence of the previous change modelling an attempt rather than a result, and worth recording as one — it was not designed for this.

### `paidAt` becomes optional, and `received` learns to filter

These are one decision, not two.

A pending payment has no date on which money moved. Making the column nullable is the honest record, and it is also what **forces** the report to confront the question: the loop that adds `payment.paidAt` to a bucket cannot compile against a nullable field without deciding what a missing date means.

Storing a placeholder date instead — the moment the attempt was created — would keep the code compiling and quietly inflate `received` by every abandoned attempt. The compiler error is the point.

`received` therefore counts `succeeded` and `reversed`, and nothing else. Stated in the spec rather than left as an implementation detail, because it was true accidentally before and has to be true deliberately now.

### One live link per bill, and the gateway decides whether it is still live

Returning to a bill that already has a waiting attempt hands back the same code and the same link.

Creating a second was the original behaviour and is wrong in two directions at once: the tenant holds two QR codes for one debt and cannot tell which to use, and the owner's dashboard fills with attempts of which all but one will sit there unpaid forever. Neither is a correctness problem — the reference is unique either way and only one can be confirmed — but "not incorrect" is a low bar for something a person has to read.

The link therefore has to be **kept**, which it previously was not: the first implementation returned the checkout URL and the QR to the caller and stored neither.

Reuse is conditional on asking the gateway, because a stored link can have died since — cancelled by the tenant on the gateway's own page, or expired. Handing back a dead code is worse than making a new one, and the only party that knows is the gateway.

That question turns out to be worth more than the reuse it was added for. It is the **only place** `cancelled` and `expired` are ever reached: a confirmation only ever reports success, so without this the two states would sit in the enum unreachable — which is exactly what this project refused to ship in the previous change and had almost shipped here.

### Trusting an outbound answer without a signature

The gateway's reply to a question we asked is trusted; a confirmation it posts to us is not, until its signature verifies. That looks inconsistent and is not.

A confirmation is **inbound**: the endpoint is public, anyone on the internet can post to it, and the signature is the only thing separating the gateway from an attacker. The reply to `fetchPaymentLink` is **outbound**: we opened the connection, to a host we named, over TLS, presenting our own API key. There is no one else who can be at the other end of it.

### Acting on that answer for a tenant, reporting it to an owner

Where the gateway says a bill was paid and we did not know, the tenant's path **settles it**; the owner's reconciliation **reports it and changes nothing**.

The reading is the same reading. What differs is the cost of not acting. An owner asking whether anything is wrong can be told "these disagree" and will go and look — that is what they asked for. A tenant asking to pay cannot be told "possibly nothing is wrong"; not acting means taking their money a second time for a debt they have already settled.

So the asymmetry is about consequence, not confidence. Worth writing down because the two paths now read the same response and do different things with it, and the next person will otherwise assume one of them is a mistake.

### An invoice may carry more than one succeeded payment

The previous change verified that a paid invoice had exactly one. That was right for a world where only an owner could record a payment and marking an already-paid invoice was refused.

It cannot survive a gateway. An owner takes cash at ten o'clock; the tenant's transfer, already in flight, succeeds at one minute past. The money is in the bank. The three available responses are to record it, to record it with a flag, or to discard it — and discarding money that exists is not a choice.

So the invariant relaxes from **exactly one** to **at least one**. The excess is visible as the sum of an invoice's succeeded payments exceeding its total, and `received` reports both, because both arrived. The owner reverses one, which is already the mechanism for handing money back.

The alternative — a separate "overpayment" concept — was rejected as a second way of saying the same thing. Two succeeded payments against one invoice *is* the overpayment.

### Confirmations are verified in a fixed order, and rejections are silent

Signature first, before anything else in the payload is read. Then the reference must resolve to a payment. Then the amount must equal the invoice's total. Only then is anything settled.

The order matters: reading a reference out of an unverified payload and looking it up is already trusting it enough to let an attacker probe which references exist.

A rejection is recorded and answered without saying which check failed. The endpoint is public and anyone can post to it; telling a prober whether their signature was wrong, or their reference unknown, or merely their amount off, is telling them how to get closer.

Signature verification is over the `data` object rather than the raw request body, which is what this provider specifies — so ordinary JSON parsing is safe here. That is worth writing down because the opposite is true of several other gateways, and someone who has integrated one of those will expect to need the raw bytes.

### Idempotency comes from the payment's own state, not from a separate ledger

A confirmation is applied only to a payment that is `pending`. One arriving for a payment that has already succeeded, been cancelled or expired changes nothing and answers success — which is exactly what a retrying gateway needs to hear to stop retrying.

This needs no delivery table, no seen-message set, and no expiry policy for either. The state machine already refuses to move twice.

### The raw payload is stored

For every confirmation, valid or not.

What the gateway actually sends is the one thing that cannot be established from the documentation with certainty, and the first field that differs will differ at three in the morning on a real payment. A stored original turns that from a guess into a five-minute read.

It is also the reason a rejected confirmation is worth keeping: a signature that will not verify is either an attack or a mistake in our own implementation, and only the payload distinguishes them.

### Credentials are one setting

All three or none, checked as a group at startup.

Absent, the system runs and the portal offers no way to pay — the `OPENMAP_API_KEY` precedent, and for the same reason: nobody should be unable to start the backend because they do not take card payments.

Partially present, the system refuses to start. This is where it differs from the precedent, and deliberately: a client id without a checksum key produces a system that *creates* payment links and cannot verify their confirmations. It would look like it was working, take a tenant's money, and be unable to record it.

### The description will be nearly useless, and the reference is what reconciles

Nine characters is not enough for anything a person would recognise on a bank statement. Whatever goes there, an owner matching a transfer to a room will do it by the gateway's reference and the payment record, not by reading the description.

Worth stating so that nobody later spends effort making the description more informative than the limit permits. Whether the limit applies to this account depends on whether it is linked to a payOS bank account, which is checked during implementation rather than assumed here.

## Risks / Trade-offs

- **A public endpoint that changes money.** The portal opened a public door for reading; this one settles bills. → The signature is the whole defence, so it is verified first, in a constant-time comparison, and the verification is checked against payloads signed with a wrong key, a tampered amount, and a tampered reference — not only against correct ones.

- **The documentation may not match what the gateway sends.** → The raw payload is stored, and the end-to-end verification runs against a real registered webhook through a tunnel rather than only against payloads this project signed itself.

- **A confirmation could arrive while the owner is recording cash.** → Both are transactions on the same invoice, and the second finds the first. The outcome — two succeeded payments — is the specified behaviour, not a race that corrupts anything.

- **Webhooks get lost, and nothing notices.** → Reconciliation exists for exactly this, and reports rather than resolves. The residual risk is that nobody runs it; that is a scheduling concern for a later change, and naming it here is what makes it visible.

- **`received` changes meaning on existing data.** → It does not: no payment in a state other than succeeded or reversed can exist yet, so the figure must be identical before and after. That is the cheap check this change still has, and it is used.

- **Credentials in logs.** The gateway's responses and errors may carry them. → Redaction covers request headers today, not outbound calls. Any logging of a gateway request or response has to exclude the key deliberately, and the verification asserts it.

## Migration Plan

1. Add the gateway states, the gateway's fields on `Payment`, and make `paidAt` nullable. Existing rows keep a date, because every one of them is a payment that happened.
2. Fix `received` to filter by state, and confirm the reported figures are unchanged — no row can yet be in a state that would alter them.
3. Add the gateway module, the portal's pay endpoint and the webhook, none of which existing behaviour depends on.
4. Register the webhook with the provider through a tunnel.
5. Rollback is dropping the new columns and removing the two endpoints. `paidAt` would have to be made non-nullable again, which is safe only while no pending payment exists — so the rollback window closes with the first one.
