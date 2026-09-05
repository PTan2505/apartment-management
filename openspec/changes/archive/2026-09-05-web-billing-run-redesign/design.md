## Context

See proposal.md — Why.

`BillingRunPage` keeps a per-row state map (`reading`, `status`, `error`) and a
`localProblem` that already rejects a reading below the opening one before any
request. Rows leave the list because the query refetches after a success, which
is the mechanism behind the requirement that what remains is what is left to do.

`GET /invoices/due` resolves each tenancy's opening reading from the same rule
the issuing path uses. The rate lives on the building and is read by
`invoices/service.ts` at issue time as `lease.room.building.electricityRate`.

## Goals / Non-Goals

**Goals**

- The row says what it will bill, while it is being typed.
- The rate comes from the endpoint that already has it.
- Ten readings can be entered without touching the mouse.

**Non-Goals**

- Changing when a row leaves the list, or what an invoice charges.
- The design's batch gate. Rejected in the proposal, and contradicted by an
  existing requirement.

## Decisions

### The rate is added to the due report, not fetched per building

The frontend could load the buildings list and join on `buildingId`. Rejected on
the rule this project already follows: the shape is wrong at the source, and we
own the source. The endpoint holds the building row while it resolves each
tenancy; returning one more field from it costs nothing, while assembling it in
the browser costs a second request and a second copy of "which rate applies".

It is additive, so nothing breaks: existing callers ignore a field they do not
read.

### Consumption is computed in the browser; the rate is not

These look alike and are not. Consumption is subtraction of two numbers already
on the row — there is no rule to get wrong and nothing for a server to be the
authority about. Which rate applies is a decision the backend makes when it
issues, and a second implementation of it in the browser is the one that
eventually disagrees with the invoice.

The test that separates them: getting it wrong would put a WRONG FACT on screen,
versus merely an unhelpful one.

### Enter confirms; it does not submit a form

The row's input sits in no form, so Enter does nothing today. It will call the
same `issue(row)` the button calls — not a parallel path — so a reading the
screen has rejected is refused identically, and there is one place to change if
issuing ever changes.

Enter and not Tab: Tab already moves between fields natively and taking it over
would break the one keyboard behaviour the screen already has.

### Status is derived, never stored

Entered / waiting / in error is a reading of state the row already holds. Adding
a fourth field to the state map would create two sources for one fact, and the
familiar bug where a row is corrected and its status is not.

### The progress figure counts rooms outstanding, not rooms billed

It reads "7/10 rooms entered", where 10 is what is still on the list. Rows leave
as they are issued, so a denominator counting rooms billed today would climb and
fall as the owner worked — a progress bar that goes backwards.

## Risks / Trade-offs

**Enter issuing on a keystroke makes an accidental invoice easier** → The
invoice is reversible: withdrawing one is a supported operation with its own
screen. Weighed against a round-trip to the mouse per room, twenty times a
month.

**The consumption column moves as the owner types, including through nonsense
intermediate values while a four-digit number is half-entered** → It shows
nothing at all until the entry parses as a whole number, so a half-typed reading
reads as blank rather than as a wrong figure.

**Adding a field to a shared response could grow it for callers that do not want
it** → One number per row, on a response already carrying a room, a building and
a tenant.

## Open Questions

None. The three that would have changed this — batch versus per-row, whether to
touch the API for the rate, and whether to take the keyboard shortcut — were put
to the owner before it was written.
