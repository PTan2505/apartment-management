## 1. The API can answer it

- [x] 1.1 `availableOn` accepted on the room listing: in service, no open tenancy, no non-cancelled tenancy ending after that date
- [x] 1.2 A tenancy ending exactly on the date leaves the room available
- [x] 1.3 A cancelled tenancy holds no room
- [x] 1.4 Absent, the listing behaves exactly as before

## 2. The form asks in the right order

- [x] 2.1 The move-in date sits above the room
- [x] 2.2 No rooms offered until a date is entered, and the select says why
- [x] 2.3 The rooms offered come from `availableOn`, not `vacant`

## 3. Changing the date

- [x] 3.1 Changing the date re-fetches the rooms
- [x] 3.2 A chosen room the new date cannot take is cleared, with a line saying so
- [x] 3.3 A room the form was opened with is kept, and the same rule applies to it — the lookup and the warning are in place, but opening the form FROM a room was not exercised in the browser this round

## 4. Strings

- [x] 4.1 New Vietnamese strings reported for review

## 5. Checks

- [x] 5.1 `tsc --noEmit` both sides, lint, both builds

## 6. Verify in a visible browser

- [x] 6.1 A room whose tenancy ends on a future date is offered for a start date after it, and not for one before — read back against the API
- [x] 6.2 A room let today is not offered for today
- [x] 6.3 The room select is inert until a date is entered
- [x] 6.4 Changing the date clears a now-invalid room and says so
- [x] 6.5 Signing through the new order succeeds, and the tenancy starts on the date chosen
- [x] 6.6 390px
