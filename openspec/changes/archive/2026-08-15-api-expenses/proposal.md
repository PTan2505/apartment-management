## Why

The system records everything tenants pay and nothing the owner pays, so "revenue" is currently only half a number. Two costs need capturing: the electricity a room consumes while nobody lives in it, and everything else the owner spends on a property — cleaning, repairs, and one-off fees. Without both, revenue reporting can report what was billed but never what was actually earned.

## What Changes

- Add an `Expense` model recording what the owner paid: which building and optionally which room, a category, an amount, when it was incurred, and whether the system or the owner created it.
- Let an owner record, list, update, and delete expenses directly.
- **Charge a vacant room's electricity to the owner**, reconciled at two moments:
  - **At each month end the room stands empty.** The owner reads the meter; any increase over the room's last known reading becomes that month's vacancy cost. If the meter has not moved, there is nothing to record.
  - **When the next lease begins.** The owner reads the meter as they already do; any remaining increase over the last known reading becomes a final vacancy cost. This catches a skipped month end, and a vacancy too short to have met one at all.
- Record the meter readings on vacancy expenses, not just a quantity, so consecutive vacant months chain from one to the next the way a lease's invoices do.
- **MODIFIED**: a new lease's default opening meter reading is now the room's *latest known* reading rather than the previous lease's closing reading. Once vacancy readings exist, the newest of them is what a new tenancy should start from — otherwise the incoming tenant inherits consumption the owner has already paid for and recorded.
- Categorise expenses with a fixed set — vacancy electricity, cleaning, repair, and other — so reporting can group by category rather than by free text.
- Expenses are deleted outright rather than soft-deleted. This deliberately differs from how invoices are voided: an invoice is issued to a tenant and the record of what was charged must survive a correction, whereas an expense is an internal note that nobody receives, and a mistyped one is better removed than preserved.

## Capabilities

### New Capabilities
- `expense`: Recording what the owner pays on a property — manual costs such as cleaning and repairs, and the electricity a room consumes while it is vacant.

### Modified Capabilities
- `lease`: "Owner can create a lease" — the default opening meter reading now comes from the room's latest known reading, which may be a vacancy reading rather than the previous lease's closing one.

## Impact

- **Code**: new `backend/src/modules/expenses/` (router, controller, service, schema); a change to the leases service so the opening-reading default consults vacancy readings; a new Prisma model and migration.
- **Database**: adds an `Expense` table with a partial unique index preventing the same vacant room-month being recorded twice. No changes to existing tables.
- **API surface**: adds routes under `/expenses`, all requiring an authenticated `owner`.
- **Behavioral change**: creating a lease on a room with recorded vacancy readings now defaults to a different (higher) opening reading than before. No production data exists, so nothing needs correcting.
- **Dependencies**: none.
- **Out of scope**: revenue aggregation, including the `net = collected − expenses` figure these records make possible, belongs to `api-revenue-reports`. Owner-definable expense categories are not included — the fixed set plus a description covers the tail. Contract file upload remains scoped to `api-lease-contracts`.
