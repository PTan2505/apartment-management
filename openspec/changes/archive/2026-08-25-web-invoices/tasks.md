# Tasks

## 1. The API answers what is due

- [x] 1.1 Report, for a month, every tenancy that can be issued a monthly invoice and has not been. Built from the rule that already refuses `POST /invoices`, not a second copy of it — two copies is one that eventually disagrees with the invoices it produced.
- [x] 1.2 Exclude a tenancy holding a non-voided monthly invoice for that month, and include one whose only invoice for it was voided. What is reported must be exactly the work outstanding, or the screen stops answering the question it exists for.
- [x] 1.3 Exclude a tenancy with no rent left within its term. Issuing one would be refused, and offering a row the API rejects is a form arguing with itself.
- [x] 1.4 Exclude a cancelled tenancy. It occupied no month.
- [x] 1.5 Report the opening reading each invoice would actually use — the closing reading of the most recent metered non-voided invoice, else the reading the tenancy started from. A figure that merely resembles it is worse than none: it is a plausible wrong number for a person to check their typing against.
- [x] 1.6 Carry each tenancy's room and building, and accept a building filter. An owner closes off one building at a time, and a row that cannot name its room cannot be acted on.
- [x] 1.7 `tsc --noEmit`, then verify by curl including the failure paths: already billed, voided, out of term, cancelled, unauthenticated.

## 2. Reading a bill

- [x] 2.1 List invoices with the filters the API already offers: building, room, month, settled or not. Unpaid is the one this exists for — an owner chasing money has no other way to ask.
- [x] 2.2 Exclude voided invoices unless asked for. A withdrawn bill mixed into a list of outstanding money makes that list wrong.
- [x] 2.3 Show an invoice's charges individually, each with what it was computed from and the period it covers. A tenant queries one line, never the total.
- [x] 2.4 State which kind of bill it is. Move-in, monthly, final and overdue answer different questions and one will be read as another otherwise.
- [x] 2.5 Show a voided invoice as voided wherever it appears.

## 3. Closing off a month

- [x] 3.1 The month-and-building picker, and the table of what is outstanding.
- [x] 3.2 Each row: the room, the tenant, the opening reading, and a field for the new one.
- [x] 3.3 Refuse a reading below the opening one before submitting. Catching a typo against a number already on screen — deliberately NOT a client-side copy of any charge calculation.
- [x] 3.4 Issue per row, not as a batch. One bad reading among twenty must not roll back nineteen correct invoices, and a failure must be attached to the row that caused it.
- [x] 3.5 A billed tenancy leaves the list; a failed one stays with its reason. What remains on the table is what remains to be done.
- [x] 3.6 Where nothing is due, say the month is closed. An empty table reads as a screen that failed to load.

## 4. Recording what was collected

- [x] 4.1 Record payment from the OPEN INVOICE, not from a list row. One click on a list of adjacent, similar-looking rows is exactly how the wrong bill gets marked paid.
- [x] 4.2 Take the method and the date the money arrived. The date is the owner's to state — money collected on the 3rd and entered on the 10th belongs to the 3rd, and the report keyed on payment dates would otherwise misplace it.
- [x] 4.3 Show the deposit held before offering to settle from it. The API refuses a bill larger than the holding, and offering the choice then reporting the refusal makes the owner discover a fact the system already knew.
- [x] 4.4 Reverse a payment from the invoice that carries it, making clear it returns the invoice to unpaid rather than erasing the record.
- [x] 4.5 Show an invoice's payment history, including reversals. What happened and what was undone are both the history.

## 5. Reaching it

- [x] 5.1 Route and navigation entry.
- [x] 5.2 Usable on a phone — the billing round is the case that matters, since the owner may be entering readings while standing in the building. A reading field that needs sideways scrolling is unusable exactly where it is most needed.
- [x] 5.3 Typecheck and build the frontend.

## 6. Verification

- [x] 6.1 Close off a month for a building with several tenancies: every one listed, each with the right opening reading, all issued, list empties.
- [x] 6.2 **The opening reading matches what the invoice actually used** — checked against the issued invoice, not against the screen. A reported figure that differs from the billed one is the failure this endpoint exists to prevent.
- [x] 6.3 One bad reading among several: that row fails and stays listed, the others are issued and leave.
- [x] 6.4 A tenancy billed for the month is absent from the list; voiding its invoice brings it back.
- [x] 6.5 A tenancy out of term, and a cancelled one, are never listed.
- [x] 6.6 An invoice reads correctly charge by charge, against the figures the API returned — including a move-in invoice, whose deposit line is not revenue, and a monthly one, whose rent belongs to the following month.
- [x] 6.7 Record a payment dated in the past; confirm the revenue report attributes it to that month and not to today.
- [x] 6.8 Settle a bill from the deposit; confirm the holding falls. Try one larger than the holding; confirm the refusal and that nothing changed.
- [x] 6.9 Reverse a payment: invoice returns to unpaid, both the payment and its reversal remain visible, and the revenue report subtracts it from the month it left.
- [x] 6.10 **Nothing already correct changed**: leases, deposits, and the revenue report for a month billed before this change behave as they did.
- [x] 6.11 On the screen, at phone width: the round is completable without sideways scrolling.
- [x] 6.12 Remove the verification data.
