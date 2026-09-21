## Context

What each of the five fields on the terms card actually does, traced through the backend rather than inferred from its label:

| Field | Stored | Read by anything? |
| --- | --- | --- |
| `reference` | generated `HD-{mã phòng}-{năm}-{id}` | Nothing. Not searchable, not on invoices, not sent to the gateway or the tenant portal. It exists to be said out loud. |
| `noticeDays` | yes | Nothing. `recordMoveOut` checks four things — already moved out, date before start, closing meter below opening, closing meter below the last invoice — and none of them is this. |
| `paymentDay` | yes | Nothing. Invoices have no due date at all — there is no `dueDate` column anywhere in the billing module. |
| `startWaterReading` | yes | Nothing. The water line is `số người × giá nước/người`; no reading is multiplied by anything. |
| `handoverSignedAt` | yes | Nothing. |

So none of the five is an input to money. The question is not "which are used" — none are — but **which an owner reaches for when a tenant is standing in front of them**.

The tracing also found a defect: `renewLease` opens the successor with `tx.lease.create` and never sets a reference, while signing sets one immediately afterwards. Two of sixty-six local tenancies have `reference = null`, and the screen renders null as a label with an empty line beneath it — which is what made the owner ask.

## Goals / Non-Goals

**Goals.** Every tenancy has a reference. The terms card holds what is worth reading. The paper-contract date is captured when the paper is in the owner's hand.

**Non-Goals.** No column is dropped and no API surface is removed. Making the biller honour a payment day, or billing water by meter, are each their own change and neither is this one.

## Decisions

### The reference is set where the lease is created, not where it is displayed

Signing already sets it in a second statement inside the same transaction, because the id is part of the reference and the id does not exist until the row does. Renewal takes the same two-step, calling the same builder. Anything else — generating it at read time, defaulting it in the mapper — would put a value on the screen that the database does not hold, and the unique index would stop enforcing anything.

The existing nulls are back-filled by a migration rather than a script, so the hosted database is fixed by the same deploy that fixes this one. The column stays nullable: a `NOT NULL` cannot be satisfied by a row that is created before its id is known.

### Three fields leave the system entirely

`noticeDays`, `paymentDay` and `startWaterReading` are dropped: columns, API fields, screens.

The first plan kept the columns, on the reasoning that dropping them would destroy what owners had already recorded. That reasoning was wrong here — the hosted database has no real data yet, and what is in the local one is test data this session created. With nothing to lose, keeping them is the worse option: three columns that nothing writes and nothing reads are three questions for whoever reads this schema next, and the answer ("we were not sure") does not survive in a schema file.

The water reading is the one that had to go rather than merely being unhelpful. Beside an electricity reading that every invoice consumes, a second meter-looking number reads as another billed meter. It is not. Someone would eventually reconcile a water bill against it and find that nothing adds up, because nothing was ever added.

### Why the notice period cannot simply be "made to work"

Notice is the distance between the day the tenant SAYS they are leaving and the day they leave. The system records the second and has never recorded the first, so there is nothing to subtract from. Comparing the move-out against the expected end date is a different measurement — early or late against the term, not notice given against notice agreed — and presenting it as notice would be a wrong answer confidently displayed.

So the choice was between a field that is honestly inert and no field at all. Inert fields accumulate: each one costs a row of screen, a line of schema, and a moment of doubt for every reader. When notice matters, it arrives as a change that records when notice was given, and the column comes back alongside the thing that fills it.

### The signing date is asked for at signing

It was only ever available in the correction dialog, which is the wrong moment: the paper is signed at handover, and a field that can only be filled in later is filled in never. It is optional there, as it is everywhere — a tenancy recorded from an old paper file may have no date anyone remembers.

The label says what the owner did, not what the record is called internally: the date the contract was signed with the tenant.

### The rows spread across the card

`justify-content: space-between` on each row, from the `sm` breakpoint up. On a phone the rows are a column and it changes nothing.

With five fields the last row wrapped and the two survivors sat at opposite edges of the card with a hole between them; with three the row reads as three columns. The layout change and the field removal are the same decision seen twice.

## Risks / Trade-offs

**Three recorded facts are destroyed, not hidden.** If an owner was using the payment day as a note to themselves, it is gone and no dialog will bring it back. This rests on the hosted database being empty, which the owner confirmed — it would be the wrong call the day after real tenancies exist.

**A back-fill writes to rows nobody asked it to touch.** It only fills what is null, and the value is derived from the row's own room, start date and id — the same shape the original migration used, so a reference written today and one written then read alike.
