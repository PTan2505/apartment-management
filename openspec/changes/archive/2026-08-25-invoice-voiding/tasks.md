# Tasks

## 1. A void records why

- [x] 1.1 Record the reason a bill was withdrawn, alongside the date it was withdrawn. Nullable, no backfill — the invoices already voided were withdrawn for reasons nobody knows, and writing "Reason not recorded" into them states as fact something nobody said.
- [x] 1.2 Require a reason on the owner's void, refusing an empty or whitespace-only one. Enforced by the service, where it can be, rather than by the column, where it would cost the lie above.
- [x] 1.3 Report the reason wherever a voided invoice is returned, beside its date.
- [x] 1.4 Make the cancellation path supply its own reason for the move-in invoice it voids. A withdrawal nobody performed deliberately needs explaining more than one that was, not less — and it goes in the same column, so a reader never has to check two places.
- [x] 1.5 `tsc --noEmit`, then verify by curl including the failure paths: no reason, empty reason, already voided, paid.

## 2. Withdrawing a bill

- [x] 2.1 Offer the action on an unpaid, non-voided invoice, from the invoice itself.
- [x] 2.2 Require the reason before it can be confirmed, as free text. The mistakes are too varied for a list, and a list short enough to read would push everything into "other".
- [x] 2.3 Say what withdrawing does: the bill is KEPT as a record and stops counting towards anything owed. An owner who thinks they are erasing a record will hesitate over something safe; one who thinks they are not erasing it when they are has been misled.
- [x] 2.4 Show the reason on a voided invoice, beside the date it was withdrawn.

## 3. Where it is not offered

- [x] 3.1 Withhold the action on a PAID invoice, and say the payment is reversed first. The refusal is not the useful part — the prior step is, and it is on the same screen.
- [x] 3.2 Withhold it on an already voided one.

## 4. Finishing the correction

- [x] 4.1 After withdrawing a monthly invoice, say its tenancy is back on that month's billing list and offer to go there. Withdrawing is almost never the goal; stopping at "withdrawn" leaves the owner mid-task.
- [x] 4.2 Link to the billing list for the month the withdrawn bill covered — not the current month, which is a different month's work.
- [x] 4.3 Where the bill covers no month, offer no billing list and do not claim one. No list covers a move-in or ad-hoc invoice.
- [x] 4.4 Do NOT reissue from the dialog. Reissuing goes through the billing list like every other monthly invoice — a second path into issuing means two places handling the reading, the month and the refusals, and they will not stay identical.
- [x] 4.5 Typecheck and build the frontend.

## 5. Verification

- [x] 5.1 **Reproduce the case this exists for**: issue a monthly invoice with a reading that is wrong but not below the opening one, and confirm it cannot be corrected from any screen before the change.
- [x] 5.2 Withdraw it with a reason: invoice voided, reason recorded, excluded from what is owed.
- [x] 5.3 **The correction completes**: follow the offer, find the tenancy on that month's list opening from the same reading as before, reissue with the right reading, and confirm the new invoice charges the right consumption.
- [x] 5.4 A void without a reason is refused and nothing changes.
- [x] 5.5 The action is absent on a paid invoice and the screen names the reversal; reversing makes it available.
- [x] 5.6 Cancelling a tenancy voids its move-in invoice with the cancellation named as the reason.
- [x] 5.7 An invoice voided before this change reports no reason, rather than a substituted one.
- [x] 5.8 A withdrawn move-in invoice offers no billing list.
- [x] 5.9 **Nothing already correct changed**: the revenue report excludes the voided bill exactly as before, a normal billing round still works, and payments and reversals are unaffected.
- [x] 5.10 On the screen at phone width.
- [x] 5.11 Remove the verification data.
