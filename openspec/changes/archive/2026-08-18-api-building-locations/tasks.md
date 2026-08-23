## 1. Endpoint

- [x] 1.1 Create feature branch `feature/api-building-locations` off `dev`
- [x] 1.2 Add a query schema for the endpoint accepting `includeInactive`, shaped exactly as on the building list schema
- [x] 1.3 Add a `listBuildingLocations` service function selecting `distinct: ["city", "ward"]`, filtered by active state the same way `listBuildings` filters it
- [x] 1.4 Group the rows by city in the service, each city carrying its wards
- [x] 1.5 Sort cities and wards with `Intl.Collator("vi")`, with a comment recording that the database cannot order this correctly under `C` collation
- [x] 1.6 Add a controller returning the grouped result directly, with no pagination wrapper
- [x] 1.7 Register the route on the buildings router **above** `GET /:id`, so the literal path is not captured as an id
- [x] 1.8 Run `tsc --noEmit` and confirm it passes

## 2. Verification — content

- [x] 2.1 Seed buildings across at least two cities, with two wards in one of them, to verify against
- [x] 2.2 Verify every city with a building is reported, each carrying its own wards
- [x] 2.3 Verify a city with two wards reports both, and reports the city only once
- [x] 2.4 Verify a ward name recorded in two different cities appears under each
- [x] 2.5 Verify values are returned exactly as stored, including casing and diacritics
- [x] 2.6 Verify a returned value used as a `city` or `ward` filter on the listing endpoint returns the building it came from
- [x] 2.7 Verify two differing spellings of one place are reported as two separate values
- [x] 2.8 Verify the response carries no page, pageSize, total, or totalPages

## 3. Verification — ordering and active state

- [x] 3.1 Verify a city beginning with `Đ` sorts between `D` and `E`, not after `Z`, by comparing against the raw database order
- [x] 3.2 Verify wards within a city are ordered the same way
- [x] 3.3 Verify retired buildings' locations are absent by default
- [x] 3.4 Verify they appear when retired buildings are explicitly requested
- [x] 3.5 Verify a city whose only building is retired disappears from the default response entirely
- [x] 3.6 Verify an empty database returns HTTP 200 with an empty set rather than an error

## 4. Verification — access and routing

- [x] 4.1 Verify an unauthenticated request returns 401
- [x] 4.2 Verify an authenticated non-owner request returns 403
- [x] 4.3 Verify `GET /buildings/:id` still resolves for a real id, confirming the new literal route did not shadow it
- [x] 4.4 Verify a non-numeric building id still returns 404 rather than matching the new route
- [x] 4.5 Verify the endpoint is reachable through the frontend dev proxy

## 5. Wrap-up

- [x] 5.1 Run `tsc --noEmit` and confirm it passes
- [x] 5.2 Confirm all new imports use the `@/` alias and none use `../`
- [x] 5.3 Add the endpoint to the local OpenAPI document
- [x] 5.4 Clean up verification data, leaving the seeded owner and the existing building intact
- [ ] 5.5 Report the work for review, and commit only when asked
