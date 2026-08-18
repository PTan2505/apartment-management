## 1. Formatting fix

- [x] 1.1 Create feature branch `feature/web-buildings` off `dev`
- [x] 1.2 Add `formatRate` to `@/lib/format.ts`, preserving a fractional part and omitting it when the value is whole
- [x] 1.3 Document beside both functions why amounts and rates format differently, so a call site cannot pick the wrong one by omission
- [x] 1.4 Verify `formatRate(3500.5)` shows the fraction and `formatMoney(3000000)` is unchanged

## 2. Shared list primitives

- [x] 2.1 Add `@/lib/useListParams.ts` syncing filters and page with the URL via `useSearchParams`
- [x] 2.2 Reset the page to 1 whenever a filter changes, inside the hook, so no screen can forget it
- [x] 2.3 Add a `<Pagination>` component bound to the shared `{ page, pageSize, total, totalPages }` meta
- [x] 2.4 Add an `<EmptyState>` component taking a message and an action, used for both empty cases

## 3. Buildings data layer

- [x] 3.1 Add `@/features/buildings/types.ts` with the building and location shapes, money typed as `number`
- [x] 3.2 Add `@/features/buildings/api.ts` covering list, get, create, update, retire, restore, and locations
- [x] 3.3 Add `@/features/buildings/hooks.ts` with queries keyed so a filter change refetches, and mutations that invalidate the list and the locations
- [x] 3.4 Add a zod schema mirroring the API's create schema exactly — required name, address, ward, city; non-negative rates; defaulted country — and nothing stricter

## 4. List screen

- [x] 4.1 Add `@/features/buildings/BuildingsPage.tsx` replacing the placeholder
- [x] 4.2 Render a table at `md` and above: name with street beneath, ward with city beneath, both rates, status, actions
- [x] 4.3 Render per-building cards below `md`, offering the same actions
- [x] 4.4 Show a loading indication distinct from an empty result
- [x] 4.5 Show a failure state offering to retry when the list cannot be fetched
- [x] 4.6 Mark retired buildings visibly
- [x] 4.7 Wire pagination to the meta from the response
- [x] 4.8 Show the two empty states with their fitting actions
- [x] 4.9 Replace the placeholder route in `app/router.tsx`

## 5. Filters

- [x] 5.1 Add city and ward selects populated from `GET /buildings/locations`
- [x] 5.2 Narrow ward choices to the selected city, from the same response with no extra request
- [x] 5.3 Discard a selected ward that does not exist under a newly selected city
- [x] 5.4 Add the include-retired toggle, passing the same value to the listing and the locations query
- [x] 5.5 Add a control to clear all filters
- [x] 5.6 Reflect filters and page in the URL, and restore them when an address is opened directly

## 6. Create and edit

- [x] 6.1 Add `@/features/buildings/BuildingFormDialog.tsx` using `react-hook-form` with the zod resolver
- [x] 6.2 Make the dialog full screen below `md`
- [x] 6.3 Use the same dialog for create and edit, prefilled when editing
- [x] 6.4 Attribute API field-level rejections using `ApiError.fieldErrors`, falling back to a form-level message
- [x] 6.5 Indicate a submission in flight and prevent a duplicate submission
- [x] 6.6 Invalidate the list and locations on success so the screen updates without a reload

## 7. Retire and restore

- [x] 7.1 Add a confirmation before retiring, naming the building
- [x] 7.2 Restore without a confirmation
- [x] 7.3 Surface a `409` using `ApiError.isConflict`, showing the API's message verbatim
- [x] 7.4 Leave the building in service when retiring is refused
- [x] 7.5 Ensure no wording implies that retiring a building retires its rooms

## 8. Verification — listing and display

- [x] 8.1 Verify buildings are listed with name, street, ward, city, both rates, and status
- [x] 8.2 Verify a fractional electricity rate displays its fraction rather than a rounded figure
- [x] 8.3 Verify a whole rate displays without a misleading fractional part
- [x] 8.4 Verify rates are labelled with their units
- [x] 8.5 Verify retired buildings are hidden by default and marked when shown
- [x] 8.6 Verify the loading state is distinguishable from an empty result
- [x] 8.7 Verify a failed fetch reports the failure and offers a retry

## 9. Verification — filters and paging

- [x] 9.1 Verify choosing a city narrows the list to that city
- [x] 9.2 Verify ward choices are limited to wards in the selected city
- [x] 9.3 Verify changing the city discards a ward that does not exist under it
- [x] 9.4 Verify a city whose only buildings are retired is not offered while retired buildings are excluded
- [x] 9.5 Verify filters and page appear in the URL, and opening that address restores the view
- [x] 9.6 Verify browser back restores the previous filter selection
- [x] 9.7 Verify changing a filter while on a later page returns to page 1 rather than showing an empty page
- [x] 9.8 Verify clearing the filters restores the full list
- [x] 9.9 Verify a city and ward pair that matches nothing shows the "nothing matches" state, not a broken screen

## 10. Verification — create, edit, retire

- [x] 10.1 Verify creating a building adds it to the list without a reload
- [x] 10.2 Verify creating without a country uses the default
- [x] 10.3 Verify a fractional rate is accepted and stored as entered
- [x] 10.4 Verify a negative rate is rejected by the form without a request being sent
- [x] 10.5 Verify missing name, address, ward, or city are each reported
- [x] 10.6 Verify an API field-level rejection is shown against the field it names
- [x] 10.7 Verify editing saves and the list reflects it without a reload
- [x] 10.8 Verify a submission in flight is indicated and cannot be submitted twice
- [x] 10.9 Verify retiring asks for confirmation, and cancelling leaves the building in service
- [x] 10.10 Verify retiring a building whose room has an active lease shows the API's message and leaves it in service
- [x] 10.11 Verify restoring works without confirmation and returns the building to the default list

## 11. Verification — responsive

- [x] 11.1 Verify a table is shown at desktop width and cards at phone width
- [x] 11.2 Verify the same buildings and the same actions appear in both
- [x] 11.3 Verify no horizontal scrolling at 320px and 375px
- [x] 11.4 Verify the form dialog is full screen and usable at phone width
- [x] 11.5 Verify the filters are usable at phone width

## 12. Wrap-up

- [x] 12.1 Run the frontend typecheck and confirm it passes
- [x] 12.2 Confirm every cross-directory import uses the `@/` alias and none use `../`
- [x] 12.3 Confirm the buildings placeholder page is removed and no longer referenced
- [x] 12.4 Confirm `backend/` is unchanged by this branch
- [x] 12.5 Clean up verification data, leaving the seeded owner and the existing building intact
- [ ] 12.6 Report the work for review, and commit only when asked
