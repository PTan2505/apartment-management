## Why

The billing screen asks an owner to type a meter reading for every occupied room in a building, one after another. It will produce typos — that is not a risk, it is a certainty at that volume — and the screen checks only that a reading is not *below* the one it opens from. A reading of 280 entered where the meter says 260 passes every check there is, and bills the tenant for twenty units they did not use.

There is no way to correct it. Not from the invoice, not from the billing screen, not from anywhere in the application. The owner's remaining options are to leave a wrong bill standing or to reach the API by hand.

This was named as a gap when `web-invoices` was proposed, and deferred deliberately to keep that change to a workable size. It is worth doing now rather than later because the screen that creates the mistake has just shipped, and every month it runs without this is a month of wrong bills nobody can withdraw.

**Almost all of the machinery already exists.** The API can void; it refuses to void a paid invoice and says to reverse the payment first; a voided invoice is retained and excluded from every total; and voiding puts that tenancy back on the month's billing list, where the owner re-enters the reading. That correction loop is already wired end to end and has been verified working. What is missing is a way to start it.

## What Changes

- **An owner can withdraw a bill they issued in error**, from the invoice itself. The bill is kept as a record of what was charged and stops counting towards anything owed.
- **Voiding records why.** A wrong meter reading, a bill issued against the wrong tenancy, and a charge the owner decided to waive are different events, and a voided invoice carrying only a date cannot be explained to anybody months later — least of all to the tenant asking about it. The reason is required rather than optional: an optional field on an action performed once in a while is a field that is always left empty.
- **The correction is followed through, not just started.** After voiding, the screen says the tenancy is back on that month's billing list and offers to go there. An owner who has just withdrawn a bill is mid-correction, and stopping at "done" leaves them to find their own way back.
- Where the bill has been paid, the action explains that the payment is reversed first — which the screen can already do — rather than offering something the API will refuse.

Deliberately NOT in this change:

- **Editing an invoice in place.** An issued bill is a record of what was charged; the system refuses to alter one and that is not being revisited.
- **Voiding in bulk.** Correcting a whole month's billing run at once is a different operation with different risks, and the mistake this exists for is a single mistyped row.

## Capabilities

### Modified Capabilities

- `invoice`: voiding records the reason it was withdrawn, and requires one.
- `web-invoices`: the owner can withdraw a bill issued in error and is carried on to reissuing it.

## Impact

- `backend/prisma/schema.prisma` — an invoice needs to record why it was withdrawn. Migration required.
- `backend/src/modules/invoices/` — the reason on the void path.
- `backend/src/modules/leases/` — cancelling a tenancy already voids its unpaid move-in invoice, and now has to say why.
- `frontend/src/features/invoices/` — the action, its dialog, and the route back to the billing run.
- No change to what voiding does to any total. A voided invoice is already excluded everywhere, and this change adds nothing to that.
