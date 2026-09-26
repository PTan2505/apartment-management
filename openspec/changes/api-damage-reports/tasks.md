## 1. The record

- [x] 1.1 `DamageReport` against a tenancy, with state, appointment and closing note
- [x] 1.2 Photographs through the presigned upload path, optional

## 2. The tenant's half

- [x] 2.1 Raising a report from a portal token, room taken from the tenancy
- [x] 2.2 The portal returns the tenancy's reports, with state and appointment

## 3. The staff half

- [x] 3.1 Listing for owner and assigned staff, oldest open first, filterable
- [x] 3.2 Recording and changing an appointment
- [x] 3.3 Closing with a note; a closed report refuses further change
- [x] 3.4 A report outside a staff member's buildings reads as absent

## 4. Checks

- [x] 4.1 `tsc --noEmit`, `codes:check`, `atomic:check`
- [x] 4.2 Exercised with curl: raise from a real portal token, schedule, close, and the refusals
