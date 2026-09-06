## Why

The portal reports a tenant's bills and the charges inside them. It does not report the things a tenant reaches for when a number looks wrong: which building this is, when the bill is due, when the one they already paid was settled, and who to call.

That last one matters most. The portal is opened by somebody with a question, and the screen's answer to "this looks wrong" is currently nothing at all — no number, no name. The tenant's route is to find the owner's phone number somewhere else, which is the moment a self-service page stops being self-service.

The design for the portal screen showed all of these; none could be built. They are recorded here rather than in an archived proposal, which is where the last three redesigns' deferred work went to be forgotten.

## What Changes

- The portal SHALL report the building a bill's room belongs to, so a tenant with rooms in two places can tell them apart, and so the page can say where it is about.
- The portal SHALL report who to contact about a bill, and how.
- A bill SHALL report when it is due.
- A settled bill SHALL report when it was settled, rather than only that it was.
- The portal SHALL be able to report the transfer details for an unpaid bill **without creating a payment**.

That last one is the substantive change. Today the bank account, the amount and the transfer reference come only in the response to `POST /portal/invoices/:id/pay`, which creates a payment record. A tenant who wants to type the transfer by hand, or simply to see where the money goes before deciding, cannot be shown it without the system recording a payment attempt they never made. The portal's redesign had to leave the details behind a press for exactly this reason.

### Out of scope

**A reconciliation period and a data-freshness timestamp.** The design shows both. Neither is about the portal holding more of what a tenant needs; they describe how current the page is, which is a different question and probably a different answer — a portal that says "updated at 16:30" while showing a bill paid at 16:45 is worse than one that says nothing.

**Making the portal link expire.** The design asserts a seven-day validity that this system does not implement. Whether it SHOULD is a real security decision with a real cost — a tenant losing access and an owner resending links — and it belongs to its own change, not to a field addition.

## Capabilities

### Modified Capabilities

- `tenant-portal`: the portal reports the building, the contact, a bill's due date and settlement date, and can offer transfer details without recording a payment.

## Impact

- `backend/src/modules/tenant-portal/` — the reported shape and a new read for transfer details.
- A due date does not exist on an invoice anywhere in this system yet. **Adding one is not only a portal concern**: the owner's screens want it too, and it must be one field with one meaning rather than two that drift. See the note in design.md.
- The portal screen can then show what its design calls for. That is a separate frontend change.
