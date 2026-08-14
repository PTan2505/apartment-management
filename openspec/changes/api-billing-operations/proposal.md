## Why

Buildings carry utility rates, rooms carry rent, and leases carry occupant counts — but nothing turns them into a bill. Invoicing is the point of the system: it is what the owner does every month, and it is the only source revenue reporting can aggregate. Nothing downstream can be built until an invoice exists.

## What Changes

- Add an `Invoice` model recording one bill per lease per calendar month: the meter readings it spans, the rates and amounts it applied, its total, and its payment state.
- Generate an invoice for a lease and month, computing electricity from metered consumption, water from occupant count, and rent from the room's base rate.
- **Snapshot every input onto the invoice** — electricity rate, water rate, base rent, and occupant count. The building and room specs already require that changing a rate leaves issued invoices untouched, so this is an existing obligation rather than a new choice.
- **Prorate flat charges, never metered ones.** When a lease covers only part of a month, rent and water are charged for the days occupied. Electricity is not prorated: the tenant consumed what the meter says they consumed, and scaling a measured quantity by days would discount it a second time.
- Record payment: an invoice is pending until marked paid, at which point it captures the method (cash or bank transfer) and **the date it was paid**. The payment date is captured now because revenue reporting will need to distinguish what was billed in a period from what was collected, and that distinction cannot be reconstructed from a status flag later.
- Support voiding and reissuing an invoice rather than editing one. An issued invoice is a financial record; mutating it destroys the trail of what was actually billed.
- Allow invoicing a finalized lease for periods it covered. A lease that ended on the 15th still needs its final bill, so billing deliberately does not require an active lease.
- **MODIFIED**: creating a lease now captures the meter reading the tenancy starts from, defaulting to the previous lease's closing reading but overridable by the owner. This is what keeps a new tenant from paying for electricity used while the room stood empty, and it makes a replaced meter an ordinary case — the owner simply enters the new meter's reading.
- **MODIFIED**: recording a move-out now captures the meter reading at handover, which both closes the outgoing tenancy's electricity and establishes the baseline the next one starts from.

## Capabilities

### New Capabilities
- `invoice`: Generating monthly bills for a lease — utility and rent calculation, proration for partial months, payment tracking, and voiding.

### Modified Capabilities
- `lease`: "Owner can create a lease" — a lease now records the meter reading it starts from.
- `lease`: "Owner can record a move-out" — a move-out now records the meter reading at handover.

## Impact

- **Code**: new `backend/src/modules/invoices/` (router, controller, service, schema); changes to the leases module for the two meter readings; a new Prisma model and migration.
- **Database**: adds an `Invoice` table with a unique constraint on lease, year, and month. Adds `startMeterReading` and `endMeterReading` to `Lease`.
- **API surface**: adds routes under `/invoices`, all requiring an authenticated `owner`. Lease creation and move-out gain a required field each.
- **Behavioral change**: creating a lease and recording a move-out now reject requests that omit their meter reading. No production data exists, so nothing needs backfilling.
- **Dependencies**: none.
- **Out of scope**: owner-paid expenses — cleaning, repairs, and the electricity consumed while a room stood vacant — belong to a follow-up `api-expenses` change, which also generates the vacancy cost from the meter gap this change introduces. Revenue aggregation belongs to `api-revenue-reports`. Contract file upload remains scoped to `api-lease-contracts`.
