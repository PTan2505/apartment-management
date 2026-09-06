## Context

See proposal.md — Why.

The portal is three files. `PortalApp.tsx` resolves the token, fetches `/portal`, and owns the expand/collapse state and the payment polling. `InvoiceCard.tsx` renders one bill and its charges. `PaymentPanel.tsx` renders the transfer details once an offer exists.

Everything comes from one `PortalOverview` — `{ tenant: { fullName, phone }, invoices: [...] }` — and the transfer details come from a second call the tenant triggers.

Three constraints, the first two set by the owner and the third by the system:

1. **Presentation only.** No change to `api.ts`, to any request, or to any shape.
2. **Nothing invented.** Six fields the design shows are not reported; they are named in the proposal and left out.
3. **Nothing asserted that is not true.** The seven-day expiry is the case, and it is not a styling decision.

## Goals / Non-Goals

The newest bill open on arrival, an unpaid bill leading with what is owed, charges with their working subordinate, and the design's typography throughout. Not: the API gaps, the pay-on-load transfer block, or the mockup's illustration panel.

## Decisions

### The newest bill opens; the rest stay closed

Currently the card list opens fully collapsed. The new default is "index 0 expanded", which is a change to initial state and not to behaviour: the tenant can still collapse it and expand any other, exactly as now.

It is the newest bill rather than "the first unpaid one" deliberately. Newest is a fact about the list; "the one they came for" is a guess, and it is wrong for the tenant who has just paid and opened the link to check that it registered — for whom the newest bill is precisely the right one to see.

### The transfer details keep their trigger

`PaymentPanel` is reached by pressing, because the data behind it comes from a call that creates a payment record. The design shows it inline; building that means calling on load for every unpaid bill.

This is the "fix it at the source" rule cutting the other way. The shape is not wrong — an endpoint that creates a payment SHOULD be a POST the tenant triggers. What the design wants is a different endpoint that reports transfer details without creating anything, and that is a backend change, recorded in `api-portal-detail` rather than worked around here by calling the mutating one on render.

### The expiry sentence is not written

Recorded as a spec requirement rather than left as a decision in this document, because a later designer will meet the same mockup and needs the reason attached to the rule rather than buried in a change nobody reads. The "link no longer works" state stays and keeps saying what it can honestly say.

### Charge working goes beneath, in a smaller weight, and loses nothing

The risk in this reordering is dropping a figure while making it subordinate. The quantity, rate, period and meter readings are what make a bill checkable, and a tenant querying a number is the whole audience for this screen. The spec says so, and a task checks each one is still present.

### One layout

The portal has always been a phone screen — it is opened from a message — and the design is a phone screen. There is no second layout to keep in step, which is why this change is smaller than the owner-side redesigns despite touching a similar amount of markup.

## Risks / Trade-offs

- **Opening a bill by default lengthens the first paint** on a tenant with many charges. → It is one card of a handful, and the alternative costs a tap for the common case.
- **Reordering charge details risks silently dropping one.** → Enumerated in the spec and checked one by one against a bill that carries all of them.
- **The screen will not look like the picture**, because the transfer block is behind a press and six fields are absent. → Both recorded here and in the proposal, with the reasons, so the difference is a decision on the record rather than an oversight.

## Migration Plan

None. Presentational, no persisted state, no data shape touched.

## Open Questions

None. The transfer block, the expiry sentence and the six absent fields were put to the owner before this was written; the answers are in the proposal.
