## 0. The question that has to be answered first

- [ ] 0.1 Establish which reference the payment reconciliation actually matches on. A tenant shown one reference while the system matches another produces a payment nobody can reconcile — and that is worse than not showing a reference at all. Nothing in section 2 may be built before this is settled

## 1. Where a bill is from, and who to ask

- [ ] 1.1 Report the building each bill's room belongs to
- [ ] 1.2 Report a contact — a name and a dialable number — per bill rather than once for the portal, so a second owner later does not make it wrong
- [ ] 1.3 Keep the portal's own shape: add the fields it needs, do not start handing over the owner's invoice with parts removed

## 2. Transfer details without a payment

- [ ] 2.1 Add a READ that reports where the money goes, how much, and the reference — creating, reserving and expiring nothing
- [ ] 2.2 Report only what does not depend on the gateway; the QR and checkout link stay with the act of paying, because the gateway creates them with it
- [ ] 2.3 Leave `POST /portal/invoices/:id/pay` exactly as it is
- [ ] 2.4 Refuse the read for a bill already settled, saying there is nothing to pay rather than handing back an account

## 3. Dates

- [ ] 3.1 Add a NULLABLE due date to the invoice — not to the portal's mapper, or the owner's screens will grow a second rule for the same question
- [ ] 3.2 Report absence as absence; never derive a due date from the issue date, which would present an obligation nobody agreed
- [ ] 3.3 Report the settlement date by reading the payment that settled the bill, rather than storing a copy that can disagree with the payments beneath it

## 4. Verification

- [ ] 4.1 `tsc --noEmit` passes and `npm run codes:check` still matches
- [ ] 4.2 `curl` the portal with a valid token and confirm building, contact and settlement date are reported
- [ ] 4.3 Confirm a tenant with tenancies in two buildings gets the right building on each bill
- [ ] 4.4 Read transfer details, then COUNT the payment rows for that invoice and confirm the number did not change — this is the whole point of the change and the one thing a shape check cannot show
- [ ] 4.5 Read them twice and confirm both answers agree
- [ ] 4.6 Start a payment afterwards and confirm it still works, and that the reference it uses is the one the read reported
- [ ] 4.7 Read transfer details for a settled bill and confirm it is refused
- [ ] 4.8 Confirm an invoice with no due date reports absence, and that nothing anywhere fills one in
- [ ] 4.9 Failure paths: an unknown token, a revoked token, and an invoice belonging to somebody else
- [ ] 4.10 Confirm the portal screen still renders unchanged against the new response, in a visible browser at phone width — this change touches what that screen reads, so `curl` is not enough
