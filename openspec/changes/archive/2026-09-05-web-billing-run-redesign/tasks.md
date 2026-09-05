## 1. The rate reaches the screen

- [x] 1.1 Add the electricity rate to what `GET /invoices/due` reports, resolved the same way the issuing path resolves it so the two cannot disagree
- [x] 1.2 Mirror it on `DueForMonth` in the frontend types
- [x] 1.3 `curl` the endpoint and confirm the rate is present and matches the building's — including for a tenancy in a second building with a different rate, which is the case a single-building test would pass while broken

## 2. What the row says while it is typed

- [x] 2.1 Add the consumption column, computed from the reading typed against the one the row opens from
- [x] 2.2 Show nothing there until the entry parses as a whole number, so a half-typed reading reads as blank rather than as a wrong figure
- [x] 2.3 Show the rate on the screen, from the field added above — never assembled in the browser
- [x] 2.4 Give readings their unit wherever they appear; consumption, an opening reading and a rate are three kinds of number

## 3. The state of the round

- [x] 3.1 Add a per-row status — entered, waiting, in error — derived from state the row already holds rather than stored as a fourth field
- [x] 3.2 Tint a row in error, so it is distinguishable without reading its message
- [x] 3.3 Show rooms entered out of rooms outstanding, counting what is still on the list so the figure cannot go backwards as rows leave
- [x] 3.4 Show the total consumption entered so far
- [x] 3.5 Confirm none of this gates issuing: with some rooms empty and one in error, the ready rows still issue

## 4. Confirming from the keyboard

- [x] 4.1 Enter on a row's reading calls the same `issue(row)` the button calls — not a parallel path
- [x] 4.2 Confirm a reading the screen has already rejected is refused identically from the keyboard
- [x] 4.3 Leave Tab alone; it already moves between fields and taking it over would break the one keyboard behaviour the screen has

## 5. Verification, in a visible browser

- [x] 5.1 `tsc --noEmit` and `npm run lint` pass in both packages
- [x] 5.2 Sign in from a signed-OUT browser, assert the sign-in form is actually present before typing into it
- [x] 5.3 Type a reading and read the consumption cell back — the number, not a screenshot of it
- [x] 5.4 Type a reading below the opening one: the row tints, says why, and its control refuses
- [x] 5.5 Press Enter on a valid row and confirm the invoice is issued and the row leaves the list
- [x] 5.6 Press Enter on a row the screen has rejected and confirm nothing is issued
- [x] 5.7 With one row in error and two empty, issue a valid row — the incomplete round must not block it
- [x] 5.8 Read the progress figure back after issuing, and confirm it has not gone backwards
- [x] 5.9 Both viewport forms, 1440px and 390px, and horizontal overflow measured at zero
- [x] 5.10 The behaviour this change must not have altered: filter by building, filter by month, and open a row through to its detail

## 6. What the second verification pass found

Run under the full-screen desktop / scrolled-mobile rule. Everything here was
invisible to the first pass, which used an emulated viewport and captured only
what sat above the fold.

- [x] 6.1 Label the consumption figure on the phone card — the table names it in a column header, a card has no header, and the reader saw a bare dash
- [x] 6.2 Refuse a second press after the server has rejected the reading, and release it again the moment the reading is edited
- [x] 6.3 Say what the refusal was: a reading below the opening one is a data error, "already billed" is not
- [x] 6.4 Stop counting a server-refused room as entered — it produced no invoice, and its green chip contradicted its own red message
- [x] 6.5 Name the action column for assistive technology without drawing a label the design does not have
- [x] 6.6 Show the month named in the address even when it falls outside the offered window, by widening the list rather than overriding the address
- [x] 6.7 Provoke the rejection for real — issue the invoice elsewhere and press the stale row, the two-tab case an owner actually hits — never by faking a response
- [x] 6.8 Confirm each fix on both layouts, reading values back, with horizontal overflow measured at every scroll position rather than only at the top
