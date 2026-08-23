## Context

See proposal.md — Why. What shapes the approach:

- `api-lease-terms` has just established the principle this change follows: a lease fixes its terms when it is made, and later edits to what the room or building asks do not reach back into it. `baseRent` is a copy for exactly this reason.
- Two partial-unique-index patterns already exist and both apply here: `Room`'s "unique among active rooms in a building" for the fee name, and `LeaseOccupant`'s "no duplicate active occupant" for the selection.
- `Expense` already derives an amount from `quantity × unitRate` rather than storing it, with the reasoning that a stored figure could disagree with what it came from. The monthly amount of a lease's fee is the same shape.
- Nothing consumes these tables yet, so this change cannot alter existing behaviour. That is deliberate and is what makes it safe to land before the billing change.

## Goals / Non-Goals

**Goals:**

- Record what a building charges for, and what each lease actually agreed to.
- Keep one rule for the whole agreement: what the lease settled, the lease keeps.

**Non-Goals:**

- Putting any of this on an invoice. The billing change adds line items and proration.
- Repricing running leases in bulk. Named as a limitation below rather than solved.
- Usage-metered services. A fee is a fixed monthly amount times a quantity; a washing machine charged per wash is a different thing and is not modelled.

## Decisions

### The lease copies the unit amount

Selected over referencing the building's fee, which would have made a price change apply to every running lease at once.

This was not the obvious answer. Rent is negotiated per tenant, so fixing it per lease is clearly right; a rubbish fee is an operating cost that genuinely rises for everyone at once, so following the building's current price has a real argument behind it. The deciding consideration was consistency: with copying, the whole agreement obeys one rule — the lease keeps what it agreed — and there is no second rule to explain or to get wrong.

It also removes a problem rather than creating one. Because each lease holds its own amount, **retiring a fee cannot break a running lease**: there is nothing left to resolve at billing time. Under a reference model, retiring a fee that active leases still use would need its own rules about what a retired fee means to an existing bill, and those rules would be load-bearing and easy to get subtly wrong.

**Alternative considered:** *reference the building's fee, read its price at billing time.* Rejected as above. Its advantage — a price rise takes effect everywhere immediately — is real, and its cost is stated as a limitation rather than hidden.

### Quantity is separate from the agreed amount, and changing one must not move the other

A lease's fee row holds both a copied `unitAmount` and a `quantity`, and they are changed by different actions for different reasons.

The failure this guards against is specific: an owner increases a tenant's parking from one bike to two, and the tenant's first bike silently becomes more expensive because the row was re-copied from the building's now-higher price. The tenant did not renegotiate their parking; they bought a bike. So a quantity change writes the quantity and nothing else.

Adding a fee that the lease never had is the opposite case and copies the current price, because nothing about that fee was ever agreed.

### Everything has a quantity, including flat fees

Internet has a quantity of one, forever. That is simpler than a `isPerUnit` flag or two kinds of fee, and the alternative buys nothing: a flat fee and a per-unit fee with quantity one behave identically in every calculation.

The quantity defaults to one so the common case needs no input.

### The monthly amount is derived

`unitAmount × quantity`, computed on read. Storing it would create a third value that can disagree with the two it comes from — the same reasoning that made `depositAmount` derived in `api-lease-terms`, and that `Expense` already applies to its own amount.

### Fee names are unique among a building's offered fees, not globally

Two entries called "Parking" in one building are indistinguishable at the moment of selecting one, which is the moment it matters. Across buildings they are fine, and a retired fee's name is released.

This is the `Room.roomCode` rule with the words changed, so it uses the same partial unique index shape rather than inventing another.

## Risks / Trade-offs

- **A building-wide price rise leaves running leases on the old price, with no bulk mechanism.** Ten leases at an old rubbish fee is ten months of the owner absorbing the difference. → Accepted deliberately as the cost of the copying decision, and stated in the proposal rather than discovered later. Changing agreed terms mid-tenancy is a distinct problem — it needs a record of what changed and when, because a bill spanning the change must know which price applied — and folding it in here would smuggle a second, larger feature into a config change.

- **A lease's selections are its current state, with no history.** Removing a fee removes the row. An invoice generated for a month *after* the tenant dropped a service will not include it even if they had it for part of that month. → Acceptable while invoices are generated month by month at the time, which is the intended use. The billing change should be the place this is confirmed rather than assumed, since it owns invoice generation; noted here so it is not forgotten.

- **Nothing consumes these tables on landing.** The feature is invisible until the billing change ships. → Deliberate, and the same split `api-lease-terms` used: config and terms land first, money moves later. The alternative is one change that both defines fees and rewrites billing, which is harder to review and harder to roll back.

- **Zero-amount fees are allowed.** A fee at no charge is permitted, which could mask a data-entry slip where an amount was meant. → Accepted: a service included at no charge is a real arrangement worth recording, and refusing zero would force the owner to either invent a price or not record the service at all.
