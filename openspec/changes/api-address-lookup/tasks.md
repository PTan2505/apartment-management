## 1. Schema

- [x] 1.1 Create feature branch `feature/api-address-lookup` off `dev`
- [x] 1.2 Add a nullable `placeId` to the `Building` model, recording where an address was resolved from
- [x] 1.3 Generate and apply the migration, confirming no backfill is needed for the existing hand-typed building
- [x] 1.4 Regenerate the Prisma client

## 2. Address module

- [x] 2.1 Add `backend/src/modules/addresses/` with router, controller, service, and schema
- [x] 2.2 Add a query schema requiring non-empty search text and accepting an optional session token
- [x] 2.3 Call the provider's search with `admin_v2` enabled, passing the session token through when given
- [x] 2.4 Call the provider's resolve with `admin_v2` enabled and the OSM response format
- [x] 2.5 Comment at the call site that the key goes in the query string because the provider's gateway rejects the header form with a 401
- [x] 2.6 Comment that disabling `admin_v2` silently returns pre-reform wards and an abolished district tier
- [x] 2.7 Apply a timeout to both outbound calls so a slow provider cannot hang a request

## 3. Normalization

- [x] 3.1 Map the provider's fields onto this system's shape: street line, ward, city, country, and the resolved identifier
- [x] 3.2 Combine house number and street into the street line, yielding an empty line when the provider supplies neither
- [x] 3.3 Strip a leading administrative designation from ward and city, only when it is a complete leading word with a non-empty remainder
- [x] 3.4 Discard the district entirely rather than reporting it under another name
- [x] 3.5 Ensure no provider field name, tier, or structure appears in any response

## 4. Failure handling

- [x] 4.1 Report that lookup is not configured when no key is set, in the standard error shape, without calling the provider
- [x] 4.2 Report that lookup is unavailable when the provider is unreachable, times out, or rejects the system's key
- [x] 4.3 Ensure the provider rejecting the system's key never surfaces as the caller being unauthenticated
- [x] 4.4 Return 404 for an identifier the provider does not recognise
- [x] 4.5 Ensure no part of the key appears in any response, error, or log line
- [x] 4.6 Register the router with `authenticate` and `requireRole("owner")`

## 5. Building integration

- [x] 5.1 Accept an optional `placeId` on the building create schema
- [x] 5.2 Accept it on the update schema, allowing it to be cleared
- [x] 5.3 Return it on every building response
- [x] 5.4 Confirm address validation is unchanged by its presence or absence

## 6. Verification — search and resolve

- [x] 6.1 Verify searching returns candidates each carrying a description and an identifier
- [x] 6.2 Verify a candidate carries no address parts
- [x] 6.3 Verify text matching nothing returns 200 with no candidates
- [x] 6.4 Verify empty search text returns 400 without calling the provider
- [x] 6.5 Verify resolving returns a street line, ward, city, country, and the identifier
- [x] 6.6 Verify a street address yields a street line combining house number and street
- [x] 6.7 Verify a ward-level place yields an empty street line with ward, city, and country still present
- [x] 6.8 Verify an unrecognised identifier returns 404

## 7. Verification — normalization

- [x] 7.1 Verify the ward reported is the post-merger one, by comparing a known place against the same place resolved without `admin_v2`
- [x] 7.2 Verify no district appears in any response, under any name
- [x] 7.3 Verify a `phường` prefix is stripped and a `xã` prefix is stripped
- [x] 7.4 Verify a `thành phố` prefix is stripped and a `tỉnh` prefix is stripped
- [x] 7.5 Verify a name is not shortened when the leading word is not a complete administrative designation
- [x] 7.6 Verify a resolved ward and city, used to create a building, are then found by the location filter with those same values
- [x] 7.7 Verify no provider field name appears in any response body

## 8. Verification — failures and access

- [x] 8.1 Verify that with no key configured both endpoints report lookup is not configured, in the standard error shape
- [x] 8.2 Verify the rest of the API works normally with no key configured
- [ ] 8.3 Verify an unreachable provider reports lookup unavailable rather than an invalid request
- [x] 8.4 Verify a rejected key reports lookup unavailable and not a 401 for the caller
- [x] 8.5 Verify no response or log line contains any part of the key
- [x] 8.6 Verify both endpoints return 401 unauthenticated and 403 for a non-owner

## 9. Verification — building field

- [x] 9.1 Verify creating a building with a `placeId` records and returns it
- [x] 9.2 Verify creating without one succeeds and records none
- [x] 9.3 Verify updating sets a new `placeId`
- [x] 9.4 Verify updating can clear it, leaving the address fields unchanged
- [x] 9.5 Verify the existing hand-typed building still has none after the migration

## 10. Wrap-up

- [x] 10.1 Run `tsc --noEmit` and confirm it passes
- [x] 10.2 Confirm all new imports use the `@/` alias and none use `../`
- [x] 10.3 Add both endpoints and the building field to the local OpenAPI document
- [x] 10.4 Clean up verification data, leaving the seeded owner and the existing building intact
- [ ] 10.5 Report the work for review, and commit only when asked
