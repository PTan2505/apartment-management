## 0. The question that had to be answered first

- [x] 0.1 Establish which reference the payment reconciliation actually matches on — ANSWERED, and it removed a feature. `orderCode` is the payment row's own id, and the receiving account is a virtual one the gateway allocates per attempt. Neither exists before a payment does, so transfer details cannot be read without creating one. Recorded in the proposal

## 1. Where a bill is from

- [x] 1.1 Report the building each bill's room belongs to, by name
- [x] 1.3 Revise the mapper's comment rather than quietly contradicting it: it lists the building among what the portal deliberately withholds, and that reasoning has to be corrected in place
- [x] 1.4 Keep withholding the ids — lease, room and building — which is what that comment was actually protecting

## 2. When a bill was settled

- [x] 2.1 Report the settlement date by reading the payment that settled the bill, not by storing a copy that can disagree with the payments beneath it
- [x] 2.2 Report no settlement date on an unpaid bill
- [x] 2.3 Report absence rather than substituting the issue date or today, where a settled bill's payment carries no date

## 3. Verification

- [x] 3.1 `tsc --noEmit` passes and `npm run codes:check` still matches
- [x] 3.2 `curl` the portal with a valid token and confirm the building and the settlement date are reported
- [x] 3.3 Confirm a tenant with tenancies in two buildings gets the right building on each bill — one building cannot prove the join is right
- [x] 3.4 Confirm no lease id, room id or building id appears anywhere in the response
- [x] 3.5 Confirm an unpaid bill reports no settlement date, and a settled one reports the date of the payment that settled it
- [x] 3.6 Failure paths: an unknown token and a revoked token
- [x] 3.7 Confirm the portal screen still renders against the new response, in a visible browser at phone width — this change touches what that screen reads, so `curl` is not enough

## 4. What the implementation turned up

- [x] 4.1 Prisma will not select one relation twice under two names. `settledPayments` beside `payments` type-checked and failed at runtime with a 500 — caught by calling the endpoint, which is why the task list asks for `curl` and not only `tsc`. The two questions are now answered from one selection, filtered in the mapper
- [x] 4.2 Seed a tenant who holds rooms in TWO buildings before checking the join. There was no such tenant, and one building cannot tell a correct join from one that reports the same building for everything
