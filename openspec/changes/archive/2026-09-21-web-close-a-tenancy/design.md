## Context

Three endpoints, no callers:

- `POST /leases/:id/move-out` — date, closing reading, and `overdueCharges[]` where the departure is late. Closes occupancy records, issues the final invoice, frees the room, all in one transaction.
- `GET /leases/:id/deposit-settlement` — held, carried in, deducted, outstanding invoices, and whether it has been returned.
- `POST /leases/:id/deposit-refund` — the date it went back.

The tenancy screen offers editing, occupants, contract pages, renewal and cancellation. Cancellation is the only ending, and it means something else entirely.

## Goals / Non-Goals

**Goals.** Close a tenancy the way it actually ends. Show the settlement afterwards and let the owner record the return.

**Non-Goals.** No partial refunds here — `deposit-adjustment` exists for moving money in and out of a holding and is its own screen. No automatic netting of unpaid bills against the deposit.

## Decisions

### Closing and cancelling stay far apart

Two endings with opposite meanings: one says a year happened and is now over, the other says nothing ever happened. They are separate actions, worded so that neither reads as the other, and the closing dialog says what closing does rather than asking "are you sure".

The cancellation dialog already carries this weight ("Đây là ghi nhận hợp đồng CHƯA TỪNG diễn ra"). The closing dialog gets the mirror of it.

### The room's last reading is shown, not defaulted into the field

The field starts empty. A default would be accepted without being read, and this number decides the final bill — it is the one figure in the dialog that nobody else can check afterwards.

What IS shown is the room's last known reading, beside the field, so the owner can see what they are continuing from. The signing form already does this and for the same reason.

### Overdue charges appear only when the date makes them real

The fee rows are offered when the departure date is later than the agreed end, and not before. Offering them always would ask every owner to consider a case that applies to few of them, and the API ignores the list where the departure is within the term.

Each row picks a fee from the BUILDING's catalogue and takes an amount. That is the API's shape and it is the right one: the name should be comparable with every other bill, while no agreement covers those days, so the amount cannot come from a price list.

### The settlement is shown, never computed into a decision

`depositHeld`, `deductedFromDeposit`, `outstandingInvoices` are displayed as three figures. The screen does not subtract the unpaid invoices from the holding and present a number to hand back.

It could. It should not: what a deposit covers is a negotiation — damage, an unpaid month, a cleaning bill — and a screen that nets them off has made that call on the owner's behalf and will be believed. The same reasoning already governs the cancellation dialog, which refuses to guess how a holding is split.

### Returning the deposit is a confirmation, not a form

The endpoint takes only a date. The screen asks for the date, states the amount being returned, and confirms — because it is money leaving, and because it cannot be undone from any screen.

## Risks / Trade-offs

**The closing dialog carries the heaviest single action in the application.** It issues a bill, ends a tenancy and frees a room. Mitigated by stating each of those before the confirm, and by the reading being typed rather than defaulted.

**The settlement screen shows figures without a recommendation.** An owner who wants to be told what to return will not be. That is deliberate, and the three figures are exactly the ones that decision is made from.
