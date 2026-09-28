## 1. Asking the question once

- [x] 1.1 `useIsOwner()` beside the existing auth hooks; the inline test in the sidebar uses it too

## 2. Controls that go

- [x] 2.1 Buildings: edit, retire and restore; the row menu goes with them when it empties
- [x] 2.2 Rooms: add, edit, retire and restore, the same way
- [x] 2.3 Tenancy: correcting terms, and correcting the occupant count
- [x] 2.4 Invoice: recording a payment, withdrawing, and reversing a recorded payment
- [x] 2.5 Nothing readable was hidden along with them

## 3. The tenancy forms

- [x] 3.1 Signing: rent, both rates and deposit filled from the room and building, read-only for a manager, and saying whose they are
- [x] 3.2 Renewing: rent and deposit the same
- [x] 3.4 Renewing gains a deposit field at all — the owner could not change it from any screen before, though the API allowed it
- [x] 3.5 Changing it recalculates the shortfall, and the confirmation stops promising the deposit is unchanged
- [x] 3.3 The owner's form is untouched — every override still works

## 4. The building form

- [x] 4.1 Default deposit months, beside the rates, whole months only, zero allowed

## 5. Strings

- [x] 5.1 New Vietnamese strings reported for review

## 6. Checks

- [x] 6.1 `tsc --noEmit`, lint, build
- [x] 6.2 In a visible browser as a MANAGER: walk buildings, rooms, a tenancy, an unpaid invoice and a paid one, reading back which controls exist — 1440px and 390px
- [x] 6.3 In the same browser as the OWNER: the same screens, every control present, and an override on the tenancy form still saved
- [x] 6.4 A manager signs a tenancy through the form end to end, and it carries the owner's figures
