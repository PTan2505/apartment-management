## Context

See proposal.md — Why. What shapes the approach:

- Every billing rule already exists and is specified: proration, metered electricity, service fees applicable during the billed period, the one-invoice-per-lease-per-month index, the refusal to issue where no rent remains in the term. Nothing here re-decides any of it.
- Rent is charged for the month AFTER the one billed. A monthly invoice settling January's utilities carries February's rent, prorated against February. This surprises people, and the screen has to survive an owner reading a bill and asking why it names two months.
- `POST /invoices` takes one lease, one month, one closing reading. There is no batch endpoint and this change does not add one.
- Payments are separate records with their own lifecycle (`succeeded`, `reversed`). An invoice carries a cached `paymentStatus` and may hold several payments over its life.
- A paid invoice cannot be voided; the payment is reversed first. Voiding is out of scope here, but reversal — its precondition — is in.

## Goals / Non-Goals

**Goals:**

- Make closing off a month a single pass, and make what remains undone visible without anybody having to notice a warning.
- Let a bill be explained to the tenant querying it.
- Keep the revenue report true, by making collection recordable and correctable.

**Non-Goals:**

- A batch billing endpoint. The screen issues one invoice per row.
- Changing any computed charge, or any rule about which invoices may exist.
- Voiding, ad-hoc charges, payment links.

## Decisions

**The billing run issues one invoice per row, sequentially, rather than in one batch request.**

A batch endpoint is the obvious shape and the wrong one here. Twenty invoices in one transaction fail as a unit: one bad reading among twenty rolls back nineteen correct invoices, and the owner has to work out which row was at fault from a single error. Per-row means a failure is attached to the row that caused it, the other nineteen stand, and retrying costs one request.

It also matches how the work actually stops. An owner interrupted halfway has genuinely billed the rooms they got through — which is the state the screen already promises to show.

The cost is twenty requests instead of one. For an operation performed once a month, by one person, on one building, that is not a cost worth designing around.

**The API answers what is due; the screen does not assemble it.**

The alternative is to fetch the month's tenancies and the month's invoices and subtract one from the other in the browser, then fetch an opening reading per tenancy. That is a request per room, and — the real objection — a second implementation of "which tenancies can be billed for this month", which has to agree with the one inside `POST /invoices` forever. The failure mode is quiet: the screen offers a row, the API refuses it, and the owner is left with a form that argues with itself.

The rule stays in the module that enforces it, and the screen asks.

**The opening reading is reported, not the consumption.**

The screen shows the reading the invoice will open from, beside an empty field for the new one. It deliberately does not compute or display "units used" as the owner types — that figure belongs to the invoice, computed by the backend from both readings, and showing a client-side preview of it invites the preview and the bill to disagree over rounding or over which reading was actually used.

What the screen does check locally is that the new reading is not below the opening one. That is not a re-implementation of a charge; it is catching a typo against a number already on screen, and the API refuses it anyway.

**Payment is recorded from the invoice, not from the list.**

Marking paid from a list row is one click and is exactly how the wrong bill gets marked paid: adjacent rows, similar rooms, similar amounts. Requiring the invoice to be open first means the amount, the room and the tenant are all in front of the owner when they confirm.

Reversal exists precisely because that will still happen sometimes.

**Deposit deduction shows the holding before it is offered.**

Settling from the deposit is refused when the bill is larger than the holding. Offering the method and then reporting a refusal makes the owner discover a fact the system already knew; the holding is shown alongside the choice instead.

## Risks / Trade-offs

**An owner enters a wrong meter reading and the invoice cannot be corrected from any screen** → Real, and not mitigated in this change: voiding is out of scope by decision, so the correction path is the API. The local check against the opening reading catches the common typo (a digit dropped, a reading transposed with the previous one) but not a plausible wrong number. This is the strongest argument for adding voiding next, and the proposal names it as such.

**The month-ahead rent convention reads as an error** → The invoice detail shows each line with the period it covers, which is where the two months become legible. The alternative — explaining the convention on the screen — puts a paragraph of accounting in front of an owner who mostly does not need it.

**Twenty sequential requests partially fail** → Each row reports its own outcome and stays on the list if it did not succeed. There is no all-or-nothing state to be left in.

**A tenancy is billed between the screen loading and the owner submitting** → The API's one-invoice-per-lease-per-month index refuses the second, and the row reports it. Refreshing the list after each issue keeps this rare rather than preventing it, which is the correct amount of effort for a single-operator system.

## Migration Plan

No data migration. One additive read-only endpoint and a new frontend feature; nothing existing changes shape. Rollback is reverting the commit.
