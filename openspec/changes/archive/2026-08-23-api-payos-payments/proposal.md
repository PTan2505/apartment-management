## Why

A tenant can now see exactly what they owe and has no way to pay it. The bill is itemised down to the meter reading; settling it still means cash across a desk or a transfer the owner has to spot on a bank statement and match to a room by hand.

The payment record that would carry an online payment already exists — amount, method, date, state, reversible — and was built for this. What is missing is the half that faces outward: creating something for the tenant to scan, and being told when they have paid.

There is also a fault waiting in what exists. `received` sums every payment whose date falls in the range **without asking what state it is in**, which is correct today only because the two states that exist both belong there. The first payment that is merely *started* would be counted as money arrived.

## What Changes

**A payment can be started before it succeeds**

- **Add the gateway states**: a payment may be `pending` while a tenant is deciding, and end `cancelled` or `expired` instead of succeeding.
- **BREAKING (internal)**: the date money moved becomes optional. A payment that has not been made has no such date, and forcing one would be a fiction the cash figure then reports as fact.
- **Fix `received` to count only what actually arrived.** Today it counts every payment in range; from here it counts the succeeded ones and the reversed ones, and ignores the rest.

**A tenant can pay from the portal**

- **Add creating a payment for a bill**, from the portal, authorised by the same token and restricted to the bills that token can already see. It returns a QR code and a checkout link.
- Each attempt is its own payment record, so a link that expires and is replaced is two attempts rather than one overwritten.
- One bill at a time. Nothing is combined, so nothing has to be divided when a payment arrives short.

**The gateway tells us when it is paid**

- **Add a public webhook endpoint.** Its signature is verified before anything else is read, and the amount reported is checked against the invoice. A webhook that fails either is recorded and ignored, never applied.
- **Repeated deliveries are harmless.** The gateway retries, and applying the same payment twice would report the money twice.
- **Store the payload as received**, unparsed. The gateway's real messages are the one thing this cannot be sure of in advance, and the first surprise is much cheaper to diagnose from the original.

**Money that arrives twice is recorded, not discarded**

- Where an owner has already taken cash for a bill and the tenant's transfer then succeeds, **both are recorded**. The money genuinely arrived twice; refusing the second would leave it in the bank and out of the books.
- **This relaxes an invariant deliberately**: an invoice may now carry more than one succeeded payment, where the previous change verified there was exactly one. The excess is visible rather than silent, and the owner refunds it.

**The owner can check the gateway rather than trust it**

- **Add reconciling a payment**: ask the gateway what state it thinks a payment is in, and report a disagreement rather than resolving it. Webhooks are lost, and a system that only ever learns by being told cannot notice that it was not told.

**Configuration**

- Three credentials, read from the environment: a client id, an API key and a checksum key. **All three or none** — a client id without a checksum key would create payment links whose confirmations cannot be verified, which is worse than being unable to create them at all.
- Absent, the portal shows bills and offers no way to pay them. Present, it does.

## Capabilities

### New Capabilities

- `payment-gateway`: the outward half — configuration, creating something for a tenant to pay, being told when they have, and checking that against the gateway rather than assuming.

### Modified Capabilities

- `payment`: a payment may be started before it succeeds, may end without succeeding, and an invoice may carry more than one that did.
- `tenant-portal`: a tenant can start paying a bill they can see.
- `revenue-report`: only payments that actually happened count as received.

## Impact

**Database.** The payment gains the gateway's identifiers, the raw payload, and states it did not have. Its paid date becomes optional.

**Code.** A new module for the gateway. The portal gains a write endpoint — its first. The report gains a filter it should arguably always have had.

**Behaviour that changes.** `received` stops counting payments that never arrived. On existing data the figure is unchanged, because no such payment can exist yet; that is checked rather than assumed.

**New dependency.** An HTTP call to an external service, and a public endpoint that anyone can post to. The signature is what stands between them.

**Out of scope.** Refunding through the gateway — a reversal is recorded, and the money is returned by whatever means the owner chooses. Partial payment, still. Paying several bills at once. Any payment method other than what the gateway offers.
