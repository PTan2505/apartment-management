## 1. Backend

- [x] 1.1 `listBuildings` returns each building with `roomsLet` and `roomsEmpty`, from two grouped room queries over the page's building ids — both inside one `$transaction`, so a move-out landing between them cannot make the let count exceed the in-service count
- [x] 1.2 Rooms out of service are in neither count; "let" comes from `HOLDS_ITS_ROOM`, imported, not restated
- [x] 1.3 A building with no rooms reports zero and zero

## 2. Frontend

- [x] 2.1 `Building` type gains `roomsLet` and `roomsEmpty`
- [x] 2.2 Table: a "Phòng" column with two chips — "N đang thuê" (green) and "N đang trống" (amber), grey at zero. Two figures rather than "N of M": the empty one is what costs money
- [x] 2.3 Phone card: the same two chips under the rates; measured 356/356, no sideways scroll
- [x] 2.4 The row opens the building — click, Enter, middle-click and modifier-click via `window.open`; the name is no longer a link (0 links left in the table body); the actions cell stops propagation

## 3. Checks

- [x] 3.1 `tsc --noEmit` both sides, lint, both builds, `codes:check`, `atomic:check`

## 4. Verify against the running API

- [x] 4.1 Counts match the rooms screen for every building (7 compared), including one with both (41 let / 11 empty) so the comparison is not vacuous
- [x] 4.2 Measured on a purpose-made building: 2 empty → sign a tenancy → 1 let / 1 empty → cancel it → 0 / 2 → retire a room → 0 / 1
- [x] 4.3 A building with no rooms reads 0 and 0

## 5. Verify in a visible browser

- [x] 5.1 Desktop, signed out at the start: every row's chips equal what the API reports (8 rows compared)
- [x] 5.2 Clicking mid-row opens /buildings/45 and that page carries the row's name; the actions menu opens without navigating; Enter on the focused row opens it; middle-click opens a second tab on the building and leaves the current tab on the list
- [x] 5.3 390px: both chips on the card, card 356/356, page 390 — no sideways scroll

## 6. Found during verification

- [x] 6.1 The browser checks reported "the actions menu does not open" for two runs while the menu was fine: the middle-click check had left a second tab in front, and synthesized mouse events reach only the foreground tab — every click was landing elsewhere and the page recorded no events at all. The driver now closes stray tabs and calls `Page.bringToFront` before it starts. Caught by logging whether the events arrived, rather than trusting the failure
