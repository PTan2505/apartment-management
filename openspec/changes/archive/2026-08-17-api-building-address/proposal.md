## Why

A building's address is a single free-text line today, so there is no way to ask which buildings are in a given ward or city. An owner managing properties across several areas cannot group or narrow their list by location, and nothing downstream can either. Structuring the address into administrative levels makes that possible.

## What Changes

- Add `country`, `city`, and `ward` to a building, alongside the existing `address`.
- **`address` narrows in meaning** from "the whole address" to the street line only — house number and street. The administrative levels now live in their own fields. This is a semantic change to an existing field, not just an addition.
- `country` defaults to `Vietnam` and need not be supplied. `city` and `ward` are required, because a building missing either becomes invisible to the filters that are the point of this change.
- Add `city` and `ward` filters to the building listing, matching partially and ignoring case — the same behaviour the room-code search already provides, so a caller need not know the exact stored spelling.
- Levels are **country → city → ward**, with no district between them. Vietnam's 2025 administrative reform removed the district tier, so a ward now sits directly under a city or province. Modelling a district would encode a level that no longer officially exists.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `building`: "Owner can create a building" — a building now records ward, city, and country, and `address` means the street line.
- `building`: "Owner can list and retrieve buildings" — listing gains ward and city filters.
- `building`: "Owner can update a building" — the new address fields are updatable.

## Impact

- **Code**: `backend/src/modules/buildings/` (schema, service) and a new Prisma migration. No other module is affected — rooms, leases, invoices, expenses, and reports all reach a building by id, never by address.
- **Database**: adds three columns to `Building`. `city` and `ward` are required, so the one existing row needs a value; with a single row and no production data this is set directly in the migration rather than backfilled.
- **API surface**: `POST /buildings` and `PATCH /buildings/:id` accept three more fields; `GET /buildings` accepts two more filters.
- **Behavioral change**: creating a building now fails without `city` and `ward`. No frontend consumes this yet.
- **Dependencies**: none.
- **Out of scope**: no reference data for cities and wards — the fields are free text, so two spellings of the same place will not group together. Normalising to lookup tables is the upgrade path if building count grows, and is noted in the design rather than built now. Also out of scope: filtering rooms, leases, or revenue by location, and any geocoding or postal-code handling.
