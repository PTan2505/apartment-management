## 1. Formatting correction

- [x] 1.1 Create feature branch `feature/web-rooms` off `dev`
- [x] 1.2 Collapse `formatMoney` and `formatRate` into a single `formatMoney` that shows decimals when the value carries them
- [x] 1.3 Record beside it why there is one function and not two, so the split is not reintroduced
- [x] 1.4 Update the buildings screen's call sites and remove `formatRate`
- [x] 1.5 Verify a whole amount is unchanged and a fractional rate keeps its fraction

## 2. Shared additions

- [x] 2.1 Extend `useListParams` so a filter can declare whether changing it replaces or pushes a history entry
- [x] 2.2 Keep dropdown filters pushing, so back undoes a choice
- [x] 2.3 Add a `<SearchField>` that debounces before reporting a change
- [x] 2.4 Have search updates replace history rather than push, so back does not walk backwards through the term
- [x] 2.5 Extract the row-actions menu shared by buildings and rooms, or record why it stays duplicated

## 3. Rooms data layer

- [x] 3.1 Add `@/features/rooms/types.ts` with the room shape including its nested building, rent as a number
- [x] 3.2 Add `@/features/rooms/api.ts` covering list, get, create, update, retire, and restore
- [x] 3.3 Add `@/features/rooms/hooks.ts` with queries keyed by filters and mutations invalidating the rooms
- [x] 3.4 Add a zod schema mirroring the API's create schema, and a separate one for update without a building
- [x] 3.5 Ensure retiring or restoring a room also refreshes the building view's rooms

## 4. Room list

- [x] 4.1 Add `@/features/rooms/RoomList.tsx` rendering a table at `md` and above and cards below it
- [x] 4.2 Show the building on each row, suppressed by a prop when a building is already established
- [x] 4.3 Mark retired rooms visibly
- [x] 4.4 Display rent with the corrected formatter
- [x] 4.5 Offer edit, retire, and restore per row, identical in both presentations

## 5. Rooms screen

- [x] 5.1 Add `@/features/rooms/RoomsPage.tsx` replacing the placeholder
- [x] 5.2 Add a building filter populated from the buildings list
- [x] 5.3 Add the debounced code search
- [x] 5.4 Add the include-retired toggle
- [x] 5.5 Add a control to clear the filters
- [x] 5.6 Wire pagination to the response meta
- [x] 5.7 Show loading, failure-with-retry, and both empty states
- [x] 5.8 Replace the placeholder route in `app/router.tsx`

## 6. Create and edit

- [x] 6.1 Add `@/features/rooms/RoomFormDialog.tsx`, full screen below `md`
- [x] 6.2 Offer a building selector when creating, listing only buildings in service
- [x] 6.3 Show the building without offering to change it when editing
- [x] 6.4 Preselect and fix the building when creating from within a building's view
- [x] 6.5 Accept fractional rent and reject negative rent in the form
- [x] 6.6 Do not judge room-code uniqueness in the form; let the API decide
- [x] 6.7 Attribute API field-level rejections, falling back to a form-level message
- [x] 6.8 Indicate a submission in flight and prevent a duplicate submission

## 7. Retire and restore

- [x] 7.1 Add a confirmation before retiring, naming the room and its building
- [x] 7.2 Restore without confirmation
- [x] 7.3 Surface the active-lease refusal on retire in the API's words
- [x] 7.4 Surface the code-taken refusal on restore in the API's words
- [x] 7.5 Leave the room's state unchanged when either is refused

## 8. Building view

- [x] 8.1 Add `@/features/buildings/BuildingDetailPage.tsx` at `/buildings/:id`
- [x] 8.2 Show the building's own details, including its rates
- [x] 8.3 Embed the room list scoped to that building, without the building column
- [x] 8.4 Offer creating a room in that building without a building selector
- [x] 8.5 Show an explicit not-found result for a building id that does not exist
- [x] 8.6 Show an empty state offering to add the first room when the building has none
- [x] 8.7 Add the route beneath the shell
- [x] 8.8 Make the building name in the buildings list open it

## 9. Verification — listing and display

- [x] 9.1 Verify rooms are listed with building, code, rent, and state
- [x] 9.2 Verify two rooms sharing a code in different buildings are distinguishable by their buildings
- [x] 9.3 Verify a fractional rent keeps its fraction and a whole rent is not padded
- [x] 9.4 Verify the buildings screen still displays its rates correctly after the formatter change
- [x] 9.5 Verify retired rooms are hidden by default and marked when shown
- [x] 9.6 Verify loading is distinguishable from empty, and a failed fetch offers a retry

## 10. Verification — filters and search

- [x] 10.1 Verify filtering by building narrows the list to that building
- [x] 10.2 Verify searching matches partially rather than requiring an exact code
- [x] 10.3 Verify building and search combine
- [x] 10.4 Verify typing a multi-character term issues fewer requests than characters typed
- [x] 10.5 Verify one back press after searching returns to the pre-search view rather than removing a character
- [x] 10.6 Verify a dropdown filter change is still undone by one back press
- [x] 10.7 Verify filters appear in the URL and opening that address restores the view
- [x] 10.8 Verify changing a filter while on a later page returns to the first page
- [x] 10.9 Verify clearing the filters restores the full list
- [x] 10.10 Verify a combination matching nothing shows the nothing-matches state

## 11. Verification — create, edit, retire, restore

- [x] 11.1 Verify creating a room in a chosen building adds it without a reload
- [x] 11.2 Verify retired buildings are not offered when creating
- [x] 11.3 Verify the building cannot be changed when editing
- [x] 11.4 Verify editing a code or rent saves and the list reflects it
- [x] 11.5 Verify fractional rent is accepted and stored as entered
- [x] 11.6 Verify negative rent is rejected by the form without a request
- [x] 11.7 Verify a duplicate code in the same building reports the API's reason
- [x] 11.8 Verify a code freed by retiring a room can be reused, confirming the form does not judge uniqueness
- [x] 11.9 Verify retiring asks for confirmation and cancelling leaves the room in service
- [x] 11.10 Verify retiring a room with an active lease reports the API's reason and leaves it in service
- [x] 11.11 Verify restoring a room whose code was taken reports the API's reason and leaves it retired
- [x] 11.12 Verify restoring a room whose code is free succeeds without confirmation

## 12. Verification — building view and responsive

- [x] 12.1 Verify opening a building from the buildings list shows its own view
- [x] 12.2 Verify the view shows the building's details and its rooms
- [x] 12.3 Verify rooms in that view do not repeat the building
- [x] 12.4 Verify creating a room there does not ask which building, and creates it in that one
- [x] 12.5 Verify the same room actions are available there
- [x] 12.6 Verify a building id that does not exist shows a not-found result
- [x] 12.7 Verify a building with no rooms offers to add the first
- [x] 12.8 Verify a table at desktop width and cards at phone width, in both places rooms appear
- [x] 12.9 Verify no horizontal scrolling at 320px and 375px on both screens
- [x] 12.10 Verify the room form dialog is full screen and usable at phone width

## 13. Wrap-up

- [x] 13.1 Run the frontend typecheck and confirm it passes
- [x] 13.2 Confirm every cross-directory import uses the `@/` alias and none use `../`
- [x] 13.3 Confirm `formatRate` is gone and nothing references it
- [x] 13.4 Confirm the rooms placeholder is removed and no longer referenced
- [x] 13.5 Confirm `backend/` is unchanged by this branch
- [x] 13.6 Clean up verification data, leaving the seeded owner and the existing building intact
- [ ] 13.7 Report the work for review, and commit only when asked
