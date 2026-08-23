# Tasks

## 1. Capture the "before" picture

- [x] 1.1 Build a database with paid, unpaid, reversed and deposit-settled invoices across several months, then save the full revenue report. `received` must come out identical on the other side — no payment can yet be in a state that would change it.

## 2. A payment that has not happened yet

- [x] 2.1 Add the gateway states: `pending`, `cancelled` and `expired`, alongside the existing `succeeded` and `reversed`.
- [x] 2.2 Make the date money moved **nullable**. A payment nobody has made has no such date, and a placeholder would be a fiction the cash figure reports as fact.
- [x] 2.3 Add the gateway's own fields to a payment: the reference sent, the identifier it returned, and the payload it later sends. Nullable — an owner recording cash has none of them.
- [x] 2.4 Add the gateway payment method.
- [x] 2.5 Migrate. Existing rows keep their date; every one of them is a payment that happened.
- [x] 2.6 Run `prisma generate`.
- [x] 2.7 **Fix `received` to count only what arrived** — succeeded and reversed, nothing else. The nullable date should make the compiler ask this question; check that it did rather than working around it. **It did**: `tsc` failed with three errors in the report's `received` loop the moment `paidAt` became nullable, which is the whole reason it was made nullable rather than defaulted.
- [x] 2.8 Relax the invoice's paid status to **at least one** succeeded unreversed payment, from exactly one.

## 3. Configuration

- [x] 3.1 Read the client id, API key and checksum key from the environment, validated as one group: all three, or none.
- [x] 3.2 Refuse to start on a partial configuration, naming what is missing.
- [x] 3.3 Start normally with none, reporting online payment as unavailable where it is asked for.
- [x] 3.4 Mirror all three in `.env.example`, documented and blank.
- [x] 3.5 Keep the keys out of every response, log and error — including anything logged about an outbound call.

## 4. Creating a payment

- [x] 4.1 Add creating a payment attempt for an invoice: write the `pending` payment, then ask the gateway, and keep the payment only if the gateway accepted it.
- [x] 4.2 Use the payment's own id as the gateway's reference. Never the invoice's — a replaced link would reuse a reference the gateway has already seen.
- [x] 4.3 Sign the request over the fields the provider specifies, sorted as it specifies.
- [x] 4.4 Send the invoice's total as the amount.
- [x] 4.5 Leave nothing pending behind when the gateway refuses or cannot be reached.
- [x] 4.6 Check what the provider actually permits in the description for this account, and fit it. Record what was found — the documented limit is 9 characters for accounts not linked to a payOS bank account. **Probed against the real account: 9, 15 and 25 characters were all accepted**, so the documented limit does not apply here. The description is now `HD<invoiceId> <roomCode>`, capped at 25 — the length that is safe across banks for a VietQR transfer note.

## 5. The portal's pay endpoint

- [x] 5.1 Add starting a payment from the portal, authorised by the portal token.
- [x] 5.2 Restrict payable bills to exactly the bills that token can already see, reusing the visibility rule rather than writing a second one.
- [x] 5.3 Answer a request to pay an invisible invoice exactly as a request to see it — as though it does not exist.
- [x] 5.4 Refuse to pay an already-paid bill.
- [x] 5.5 Report on an unpaid bill whether an attempt is already in progress.
- [x] 5.6 Keep the gateway's fields out of the tenant's response.
- [x] 5.7 Report unavailability where no gateway is configured, rather than failing.
- [x] 5.8 Run `tsc --noEmit`.

## 6. The webhook

- [x] 6.1 Add a public endpoint for confirmations, mounted outside authentication like the portal.
- [x] 6.2 **Verify the signature before reading anything else**, in a constant-time comparison.
- [x] 6.3 Resolve the reference only after the signature verifies — looking it up first is already trusting an unverified payload.
- [x] 6.4 Check the amount against the invoice's total.
- [x] 6.5 Apply a confirmation only to a `pending` payment, which is what makes a repeated delivery harmless without a separate ledger.
- [x] 6.6 Settle the payment, the invoice's status and any deposit movement in one transaction, as marking paid already does.
- [x] 6.7 Record the payload as received for every confirmation, valid or not.
- [x] 6.8 Answer a rejection without saying which check failed.
- [x] 6.9 Answer a repeated delivery with success, so the gateway stops retrying.

## 7. Reconciliation

- [x] 7.1 Add asking the gateway what state it holds for a payment.
- [x] 7.2 **Report a disagreement rather than resolving it.**
- [x] 7.3 Handle the gateway not knowing the payment at all.
- [x] 7.4 Require an authenticated owner.

## 9. One live link per bill

Added after the rest was verified: creating a second link for one debt gives the tenant two QR codes and the owner a dashboard of duplicates.

- [x] 9.1 Store the checkout URL and the QR alongside the attempt. The first implementation returned both and kept neither, so there was nothing to hand back.
- [x] 9.2 Hand back the existing attempt where a bill already has one waiting.
- [x] 9.3 Ask the gateway first whether it is still payable. A stored code the gateway has cancelled or expired is worse to return than a new one.
- [x] 9.4 Where the gateway reports it cancelled, expired, or unknown, record what became of it and create a fresh attempt. **This is the only path that reaches those two states** — check that, because an unreachable enum value is what this project refused to ship last time.
- [x] 9.5 Where the gateway reports it PAID, settle it and tell the tenant it is already paid. A confirmation was lost, and the person in front of us is about to pay twice.
- [x] 9.6 Leave the owner's reconciliation reporting rather than resolving. The asymmetry is about what inaction costs, and belongs in the design where it is explained.
- [x] 9.7 Run `tsc --noEmit`.

## 10. Verification of the reuse

- [x] 10.1 **A second request for the same bill returns the same link and the same attempt** — compared field by field, not merely "a link was returned".
- [x] 10.2 No second payment record is created.
- [x] 10.3 Cancelling the link on the gateway, then returning: the attempt is recorded as cancelled and a fresh one is created with a different reference. **Cancelled for real on payOS**; the attempt became `cancelled` and a fresh one followed with a new reference. This is the path that makes `cancelled` reachable through code rather than by hand.
- [x] 10.4 **A gateway-side PAID with no confirmation received**: returning settles the bill and refuses a second payment. **Reproduced for real, not simulated**: the registered webhook URL was a tunnel that had since died, so a genuine 2,000 VND payment left payOS reporting `PAID` while the system still held the attempt as `pending`. The tenant returning settled it, `received` rose by exactly 2,000, and they were told the bill was already paid rather than asked to pay again.
- [x] 10.5 An attempt the gateway has no record of is closed rather than handed back. **Planted a reference payOS never issued**: it was closed and a fresh attempt created, rather than the dead code being returned.
- [x] 10.6 Everything verified in section 8 still holds — in particular that a confirmation still settles a bill and that `received` is unchanged.
- [x] 10.7 Remove the verification data.

## 8. Verification against the running API

Failure paths are most of the point here. The endpoint that settles bills is public, and the only thing standing in front of it is a signature.

- [x] 8.1 **`received` is unchanged**: the report over the reference range is identical to the "before" capture, field by field.
- [x] 8.2 **`billed = settled + outstanding`** still holds.
- [x] 8.3 Starting a payment returns something to scan and something to open, and the bill stays unpaid.
- [x] 8.4 **A started payment counts toward no month's `received`.**
- [x] 8.5 Two attempts at one bill get different references. **Superseded by section 9**: a bill now has at most one live attempt, so this was verified for the behaviour that existed at the time and no longer describes what the system does. The reference is still unique per attempt — checked in 10.3, where a fresh attempt follows a cancelled one.
- [x] 8.6 Paying an invoice the token cannot see answers exactly as a request to view it does — compared byte for byte.
- [x] 8.7 Paying a bill of a room the tenant has left answers the same way.
- [x] 8.8 Paying an already-paid bill is refused and creates no attempt.
- [x] 8.9 An unpaid bill with an attempt in progress reports that it has one.
- [x] 8.10 The tenant's response carries no gateway reference, no payload and no credential.
- [x] 8.11 **A correctly signed confirmation settles the payment**, sets its date from what the gateway reported, and marks the invoice paid.
- [x] 8.12 **A confirmation signed with the wrong key changes nothing**, and its response does not say the signature was wrong.
- [x] 8.13 **A correctly signed confirmation with a tampered amount changes nothing.**
- [x] 8.14 A correctly signed confirmation naming an unknown reference changes nothing.
- [x] 8.15 **The same confirmation delivered twice leaves exactly one succeeded payment**, and the second delivery answers success.
- [x] 8.16 A confirmation for a payment that has already been cancelled or expired changes nothing.
- [x] 8.17 The payload is stored for a valid confirmation and for a rejected one.
- [x] 8.18 **A gateway payment for a bill already paid in cash records both**, leaves the invoice paid, and makes `received` include both.
- [x] 8.19 Reversing one of two succeeded payments leaves the invoice paid.
- [x] 8.20 A cancelled or expired attempt leaves the bill unpaid and counts toward no `received`.
- [x] 8.21 Reconciliation reports agreement, disagreement, and an unknown payment, and changes nothing in any case.
- [x] 8.22 The webhook endpoint accepts a request with no access token, and every other endpoint still refuses one.
- [x] 8.23 A partial configuration stops the server; none starts it; all three enable payment.
- [x] 8.24 Neither key appears anywhere in the server log after a full payment cycle, including a failed gateway call.
- [x] 8.25 **End to end through a tunnel**: expose the local server with `cloudflared`, register the webhook with the provider, and confirm the provider's own verification call succeeds. Record what the provider actually sent against what was expected. **Registered successfully** — payOS called the endpoint through the tunnel and returned `code: "00"`. Its test payload carried exactly the 16 `data` fields the documentation lists, with absent values as empty strings rather than nulls. **Decisive result: our `verifyWebhookSignature` returns true for payOS's own signature on its own payload**, which is the one thing that could not be established from the documentation. It was rejected only because `orderCode 123` resolves to no payment — the unknown-reference path, working on a real message.
- [x] 8.26 **A real payment, end to end**, for the smallest amount the provider permits: create it from the portal, pay it, and confirm the webhook arrives, verifies, and settles the bill. This is the only step that proves the documented payload matches the real one. **Run for real**: 2,000 VND against an ad-hoc invoice. The confirmation arrived through the tunnel, verified, and settled the bill; `paidAt` came from the gateway's own `transactionDateTime`. A real payment's payload carries **exactly the same 16 `data` fields** as the registration test payload, differing only in values. Replaying the stored payload byte for byte left one succeeded payment. Reconciling afterwards returned `PAID` and agreement.
- [x] 8.27 Remove the verification data, leaving the database as it was found — including any real payment made in 8.26.
