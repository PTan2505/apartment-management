## 1. Branch & schema

- [x] 1.1 Create feature branch `feature/api-building-address` off `dev`
- [x] 1.2 Add `country` (String, default `"Vietnam"`), `city` (String, required), and `ward` (String, required) to the `Building` model, documenting that `address` now means the street line only
- [x] 1.3 Generate the migration with `--create-only`
- [x] 1.4 Hand-edit the migration so the one existing building row receives values for the new required columns
- [x] 1.5 Apply the migration and confirm the columns exist with the expected nullability and default
- [x] 1.6 Regenerate the Prisma client

## 2. Create and update

- [x] 2.1 Add `ward` and `city` as required fields, and `country` as optional, to the building create schema
- [x] 2.2 Default `country` to `"Vietnam"` when it is not supplied
- [x] 2.3 Add all three fields to the building update schema, rejecting an empty `ward` or `city`
- [x] 2.4 Confirm the new fields are returned on every building response

## 3. Filtering

- [x] 3.1 Add optional `ward` and `city` fields to the building list query schema
- [x] 3.2 Apply partial, case-insensitive matching for both in `listBuildings`, combinable with each other and with `includeInactive`

## 4. Verification — create and update

- [x] 4.1 Verify creating a building without a country defaults it to Vietnam
- [x] 4.2 Verify an explicitly supplied country is recorded instead of the default
- [x] 4.3 Verify creating a building without a ward returns 400, and without a city returns 400
- [x] 4.4 Verify all three fields appear on create, retrieve, and list responses
- [x] 4.5 Verify updating ward, city, or country saves the change
- [x] 4.6 Verify updating ward or city to an empty value returns 400

## 5. Verification — filtering

- [x] 5.1 Verify filtering by city returns only buildings whose city contains that text
- [x] 5.2 Verify filtering by ward returns only buildings whose ward contains that text
- [x] 5.3 Verify filtering by ward and city together returns only buildings matching both
- [x] 5.4 Verify both filters ignore case
- [x] 5.5 Verify a location filter combines with `includeInactive` and returns retired buildings in that location
- [x] 5.6 Verify a filter matching nothing returns HTTP 200 and an empty list
- [x] 5.7 Verify pagination still applies alongside the location filters, with totals reflecting the filtered set
- [x] 5.8 Verify the endpoint still returns 401 unauthenticated and 403 for a non-owner role

## 6. Wrap-up

- [x] 6.1 Run `tsc --noEmit` and confirm it passes
- [x] 6.2 Confirm all new imports follow the `@/` alias convention
- [x] 6.3 Clean up verification data, leaving the seeded owner intact
- [x] 6.4 Commit work in atomic commits per completed task group, on `feature/api-building-address`
