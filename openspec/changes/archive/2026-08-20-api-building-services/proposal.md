## Why

A tenant pays more than rent, electricity, and water. Parking, internet, rubbish collection, shared cleaning, and the communal washing machine are all charged monthly, and none of them can be recorded anywhere today.

They are also not all the same for every tenant. A tenant with two motorbikes pays parking twice; a tenant with none pays it not at all. So a single per-building figure added to every bill would be wrong for most people in the building.

This change records what a building charges for and what each lease actually signed up to. It does not yet put them on a bill — that belongs to the billing change, which is where every other amount is charged.

## What Changes

- Add a per-building catalogue of service fees, each with a name and a unit amount. The owner defines what their building charges for; nothing is assumed.
- Let a lease select which of its building's fees apply to it, each with a quantity. Quantity defaults to one, which covers every flat fee — internet is simply a fee whose quantity is always one, not a separate kind of thing.
- **A lease copies the unit amount at the moment the fee is selected**, and bills that amount for the rest of its term. Raising a fee's price affects only leases that select it afterwards. This matches how a lease already fixes its rent: what the agreement settled, the agreement keeps.
- Let a lease's selections be changed while it runs — a tenant acquiring a second motorbike changes a quantity, and a tenant taking internet mid-tenancy adds a fee at the price current when they take it. Changing a quantity SHALL NOT re-price the fee: the unit amount is a term of the agreement, the quantity is a fact about usage.
- Let a fee be retired and restored, following buildings and rooms. Retiring removes it from what new leases may select and leaves running leases untouched — they hold their own copy, so there is nothing to break.

Deliberately out of scope:

- **Charging any of this.** No invoice changes. The billing change adds the line items that make these amounts appear on a bill, and prorates them for a partial month.
- **Changing a fee across running leases in bulk.** A consequence of copying, and a real operational cost: raising the rubbish fee for a building leaves every running lease on the old price until it ends. Recorded here as a known limitation rather than solved, because "changing agreed terms mid-tenancy" is its own problem and deserves its own change.

## Capabilities

### New Capabilities

- `service-fee`: what a building charges for beyond rent and metered utilities, and which of those charges each lease agreed to and at what price.

### Modified Capabilities

None. A lease's service fees are reached through their own endpoints, so no existing capability's requirements change.

## Impact

**Database.** Two tables. `BuildingServiceFee` — building, name, unit amount, active flag. `LeaseServiceFee` — lease, the fee it came from, the unit amount copied at selection, and a quantity. No existing table changes, no backfill, nothing to migrate.

**Code.** A new module following the established shape, plus lease-scoped endpoints for the selections, mirroring how occupants already hang off a lease.

**Existing behaviour.** None. Nothing reads these tables until the billing change does, so this cannot alter an invoice, a lease, or a report.

**Downstream.** Required by the billing change, which turns each selection into a line on a bill.
