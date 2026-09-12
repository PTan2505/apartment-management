## 1. Carry the fields through the type

- [x] 1.1 Declare the five terms on the frontend `Lease` type, each nullable as the API reports them
- [x] 1.2 `reference` is a string and never null — it is generated and back-filled

## 2. Show them

- [x] 2.1 A third group in `TermsCard`, below the dates, under its own divider
- [x] 2.2 Reference, notice period, payment day, opening water reading, handover date
- [x] 2.3 A term with no value reads "Chưa ghi nhận", never blank
- [x] 2.4 The water reading is labelled as the OPENING one, so it is not read as current
- [x] 2.5 Every string on the card is Vietnamese

## 3. Let them be recorded

- [x] 3.1 Four fields in `EditTermsDialog`: notice days, payment day, opening water reading, handover date
- [x] 3.2 The reference is NOT among them
- [x] 3.3 Extend the dialog's zod schema; keep the API's bounds (payment day 1–31, the rest non-negative)
- [x] 3.4 An untouched field is not sent — the API has no way to express "clear this". Proven at the request level by intercepting the PATCH on a tenancy with all four null and editing only the duration: the body was `{"durationMonths":9,"occupantCount":1}` and the four stayed null. Task 4.8 does NOT prove this — there the fields were pre-filled, so they were sent back with their own values

## 4. Verify in a real browser, signed out at the start

- [x] 4.1 Desktop, maximised at the display's full width
- [x] 4.2 A tenancy with NO terms recorded reads "Chưa ghi nhận" on all four, and still shows its reference
- [x] 4.3 Record all four through the dialog; read the values back off the card afterwards
- [x] 4.4 Reload and read them again, so what is shown came from the API and not from form state
- [x] 4.5 The reference does not appear in the edit dialog
- [x] 4.6 A payment day of 31 is accepted
- [x] 4.7 A payment day of 0 or 32 is refused, and the message says which field
- [x] 4.8 Editing only the duration leaves the four terms untouched
- [x] 4.9 Mobile at 390px, scrolled, with horizontal overflow measured at positions that actually differ — 5 distinct scroll positions on the page, `scrollWidth` 390 throughout; all ten fields stack to one column at x=33. The dialog needs no internal scroller at this height: it occupies y 52..792 of 844 and both buttons sit at y 737..776, inside the viewport
- [x] 4.10 `tsc --noEmit`, lint and a production build all pass

## 5. One defect the verification found

- [x] 5.1 The wrapped field sat 24px right of every other row's first field. `Stack`'s `spacing` is a margin on every child but the first, and a wrapped item carries that margin onto the next line. Measured at x=305 against 281, fixed with `useFlexGap`, re-measured at 281. Applied to all three groups in the card: the other two have the same latent bug and only avoid it by not being long enough to wrap yet
