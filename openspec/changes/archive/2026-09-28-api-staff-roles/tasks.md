## 1. The roles

- [x] 1.1 `manager` and `maintenance` added to the role enum, with a migration
- [x] 1.2 `StaffBuilding` assignment, unique per person and building
- [x] 1.3 `mustChangePassword` and `isActive` on the account

## 2. Guards

- [x] 2.1 `requireRole` accepts several roles; owner-only endpoints say so
- [x] 2.2 One middleware resolves the caller's building ids
- [x] 2.3 Listings narrow to those ids; single reads answer 404 outside them
- [x] 2.4 Maintenance reaches damage reports and nothing else

## 3. Accounts

- [x] 3.1 Owner creates staff; the password is generated and returned once
- [x] 3.2 Owner assigns and unassigns buildings, resets a password, deactivates
- [x] 3.3 Deactivating revokes that account's sessions

## 4. The first password

- [x] 4.1 Every endpoint but four refuses until the password is changed
- [x] 4.2 `POST /auth/password` changes the caller's own, revoking other sessions
- [x] 4.3 Sign-in reports that a change is owed

## 5. Checks

- [x] 5.1 `tsc --noEmit`, `codes:check`, `atomic:check`
- [x] 5.2 Exercised with curl as each role: what is listed, what is refused, and that an id outside the scope reads as absent
- [x] 5.3 Verified in a browser once the screens exist — this change is reachable only through them
