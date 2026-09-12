## 1. Asking for it

- [x] 1.1 Send `detail=rooms` with the report request
- [x] 1.2 Mirror `counts` and `rooms` on the frontend types, keeping `rooms` optional so the type says what the API says: absent means not requested

## 2. The counts

- [x] 2.1 Show, per month, how many rooms were let, collected, outstanding and unbilled
- [x] 2.2 Give the unbilled count emphasis — it is the only one that reveals something no amount on the screen would
- [x] 2.3 Show how many records an expense total is made of

## 3. The rooms

- [x] 3.1 Expand a month's row into its rooms: room, tenant, billed, collected, outstanding
- [x] 3.2 Collapse by default
- [x] 3.3 Say when a tenancy has nobody recorded, rather than showing an empty name
- [x] 3.4 Show no money-arrived figure in a room row
- [x] 3.5 Compute nothing: the counts and figures are reported, not re-derived here

## 4. Layout

- [x] 4.1 Rooms readable on a phone, where the month list is already cards
- [x] 4.2 `tsc --noEmit` and `npm run lint` pass, and the production build succeeds

## 5. Verification, in a visible browser

- [x] 5.1 Sign in from a signed-OUT browser, asserting the form is present before typing
- [x] 5.2 Desktop pass in a maximised window at the display's full width
- [x] 5.3 Expand a month and read its room rows back from the DOM — the values, not a screenshot
- [x] 5.4 Add the room rows up and check they equal the month's total — the figure, not the impression
- [x] 5.5 Confirm no room row carries a money-arrived figure
- [x] 5.6 Read the four counts back and check they sum to the rooms let
- [x] 5.7 Find a month with a room let but billed nothing, and confirm it is counted unbilled and shown with zeroes
- [x] 5.8 A room whose tenancy has nobody recorded reads "Chưa ai đứng tên" rather than blank — verified on two rows in 9/2026: P302 at 20.672.500 ₫ and X9155B at 2.833.333 ₫. The earlier note on this line was WRONG: it claimed every tenancy in the local data had a recorded tenant, and P302 had been in that state all along, carrying a billed figure. Reaching it needs no API call the service guards — the report filters occupants on `leftAt: null`, so setting `leftAt` produces exactly the state the code comments describe. Also re-checked the sums here, which were previously compared as 0 against 0: rooms add to the month for billed, settled and outstanding, and the four counts add three ways
- [x] 5.9 Verified at the API rather than through the select: `buildingIds=98` returns only B2-01 and `buildingIds=45` only the eight Trọ thủ đức rooms. The select would not open under automation this run — a tooling failure, not a screen one, and the screen renders whatever the report returns
- [x] 5.10 Mobile pass at 390px, scrolled, with horizontal overflow measured at every position

## 6. What the measurements cost

- [x] 6.1 The first pass was a VACUOUS pass: the default range is the six months before last, and every invoice in this data sits in September, so "rooms sum to total" compared 0 against 0 in every row. Re-run over 8–9/2026 it compares 154.925.000 against 154.925.000
- [x] 6.2 Two apparent defects were the extractor, not the screen: a phantom ninth room row was the inner table's header, and the failing column count came from that same row
