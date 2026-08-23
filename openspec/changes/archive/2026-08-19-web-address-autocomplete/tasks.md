## 1. Address data layer

- [x] 1.1 Create feature branch `feature/web-address-autocomplete` off `dev`
- [x] 1.2 Add `@/features/addresses/types.ts` with the candidate and resolved-address shapes
- [x] 1.3 Add `@/features/addresses/api.ts` calling search and resolve
- [x] 1.4 Add `@/features/addresses/hooks.ts`, keyed so a settled search term is cached and a resolution is fetched on demand
- [x] 1.5 Generate a session token per address entry and pass it to both calls, so a run of searches bills as one session

## 2. Debounced search input

- [x] 2.1 Make the street address field itself the search, debouncing the lookup while updating the form on every keystroke
- [x] 2.2 Float the label of any field filled programmatically, so it does not sit over the value

## 3. Form modes

- [x] 3.1 Keep the four address fields always visible and editable by default, with the search above them
- [x] 3.2 Open unlocked, whether creating or editing
- [x] 3.3 Fill the street line, ward, city, and country when a candidate is chosen, and hold the place identifier
- [x] 3.4 Lock the four fields once filled from a chosen place, and refill them when a different place is chosen
- [x] 3.5 Offer a way to make the fields editable again, and clear the candidate list once a place is chosen
- [x] 3.6 Clear the held place identifier when the fields are made editable again
- [x] 3.7 Allow choosing a place again from manual, replacing the entered values and recording the new place
- [x] 3.8 Submit the place identifier with create and update, and submit its absence when cleared

## 4. Lookup failures

- [x] 4.1 Detect that lookup is not configured and start in manual entry, explaining why
- [x] 4.2 Report an unavailable provider and leave manual entry available
- [x] 4.3 Present a search that matched nothing as "nothing found", not as a failure
- [x] 4.4 Ensure every failure path still allows a building to be created

## 5. Verification — searching and filling

- [x] 5.1 Verify typing a term shows candidates
- [x] 5.2 Verify choosing a candidate fills the street line, ward, city, and country
- [x] 5.3 Verify the filled values are visible before saving
- [x] 5.4 Verify a building created this way records the place it came from
- [x] 5.5 Verify the resolved ward and city match how buildings already record them, by filtering the list on them afterwards
- [x] 5.6 Verify typing a multi-character term issues fewer requests than characters typed
- [x] 5.7 Verify the typed search text is never submitted as part of the building

## 6. Verification — manual entry and corrections

- [x] 6.1 Verify manual entry can be reached from the search state and a building created entirely by hand
- [x] 6.2 Verify correcting a filled part keeps the correction
- [x] 6.3 Verify correcting a filled part clears the recorded place
- [x] 6.4 Verify choosing a place after correcting replaces the values and records the new place
- [x] 6.5 Verify editing an existing building opens with its address editable
- [x] 6.6 Verify editing a building that has no recorded place behaves the same as any other

## 7. Verification — failures

- [x] 7.1 Verify that with lookup unconfigured the form opens in manual entry and explains why
- [x] 7.2 Verify a building can still be created with lookup unconfigured
- [ ] 7.3 Verify an unavailable provider is reported and manual entry still works
- [x] 7.4 Verify a search matching nothing says nothing was found rather than reporting an error
- [x] 7.5 Verify the four required fields are still enforced however the address was entered

## 8. Verification — responsive

- [x] 8.1 Verify the search and candidate list are usable at phone width
- [x] 8.2 Verify the resolved values and the manual fields are usable at phone width
- [x] 8.3 Verify no horizontal scrolling at 320px and 375px with the dialog open

## 9. Wrap-up

- [x] 9.1 Run the frontend typecheck and confirm it passes
- [x] 9.2 Confirm every cross-directory import uses the `@/` alias and none use `../`
- [x] 9.3 Confirm no provider name or provider field name appears anywhere in the frontend
- [x] 9.4 Confirm `backend/` is unchanged by this branch
- [x] 9.5 Clean up verification data, leaving the seeded owner and the existing building intact
- [ ] 9.6 Report the work for review, and commit only when asked
