## 1. Branch & shared helper

- [x] 1.1 Create feature branch `feature/api-pagination` off `dev`
- [x] 1.2 Create `backend/src/lib/pagination.ts` with a zod schema fragment for `page` and `pageSize`, rejecting zero, negative, non-numeric, and above-maximum values
- [x] 1.3 Add the skip/take computation and the `meta` builder (page, pageSize, total, totalPages) to that helper
- [x] 1.4 Add a wrapper that runs the page query and the count query in a single `prisma.$transaction` and returns the `{ data, meta }` envelope

## 2. Buildings

- [x] 2.1 Compose the paging fields into `listBuildingsQuerySchema`
- [x] 2.2 Apply skip/take and the count query in `listBuildings`, preserving the include-retired filter
- [x] 2.3 Return the envelope from the buildings list controller

## 3. Rooms

- [x] 3.1 Compose the paging fields into `listRoomsQuerySchema`
- [x] 3.2 Apply skip/take and the count query in `listRooms`, preserving the building filter, code search, and include-retired filter
- [x] 3.3 Return the envelope from the rooms list controller

## 4. Customers

- [x] 4.1 Compose the paging fields into `listCustomersQuerySchema`
- [x] 4.2 Apply skip/take and the count query in `listCustomers`, preserving the role scoping and search filter
- [x] 4.3 Return the envelope from the customers list controller

## 5. Leases and occupants

- [x] 5.1 Compose the paging fields into `listLeasesQuerySchema`
- [x] 5.2 Apply skip/take and the count query in `listLeases`, preserving the room, customer, and active filters
- [x] 5.3 Return the envelope from the leases list controller, keeping the derived-value mapper applied to each item
- [x] 5.4 Add paging to `listOccupants` and return the envelope from the occupants controller, keeping the occupant mapper applied

## 6. Verification — shared contract

- [x] 6.1 Verify omitting both parameters returns page 1 at the default size with correct `meta`
- [x] 6.2 Verify an explicit page and page size returns at most that many items from the right offset, with `meta` echoing the request
- [x] 6.3 Verify `meta.total` and `meta.totalPages` describe the full matching set, not the current page
- [x] 6.4 Verify a page past the end returns HTTP 200, an empty `data`, and true totals
- [x] 6.5 Verify a page size above the maximum returns HTTP 400
- [x] 6.6 Verify zero, negative, and non-numeric page or page size values return HTTP 400

## 7. Verification — per endpoint

- [x] 7.1 Verify `GET /buildings` returns the envelope and pages correctly, including with retired buildings included
- [x] 7.2 Verify `GET /rooms` pages correctly while combined with the building filter and code search, and that totals reflect the filtered set
- [x] 7.3 Verify `GET /customers` pages correctly while combined with the search filter
- [x] 7.4 Verify `GET /leases` pages correctly while combined with the active and customer filters, and that each item still carries its derived fields
- [x] 7.5 Verify `GET /leases/:id/occupants` returns the envelope and still includes departed occupants with their dates
- [x] 7.6 Verify all five endpoints still return 401 unauthenticated and 403 for a non-owner role

## 8. Wrap-up

- [x] 8.1 Run `tsc --noEmit` and confirm it passes
- [x] 8.2 Confirm all new imports follow the `@/` alias convention
- [x] 8.3 Clean up verification data, leaving the seeded owner intact
- [x] 8.4 Commit work in atomic commits per completed task group, on `feature/api-pagination`
