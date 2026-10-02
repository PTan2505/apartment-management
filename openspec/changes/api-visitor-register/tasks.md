## 1. The record

- [ ] 1.1 `LeaseVisitor` — name, document number, two image keys, start, expected end, note, who added it
- [ ] 1.2 Expected end date required; migration
- [ ] 1.3 A fifth key prefix, content-type set and ceiling in the storage helpers

## 2. Registering

- [ ] 2.1 Create, edit while current or upcoming, cancel
- [ ] 2.2 Sign and confirm an upload per side; bytes never through the API
- [ ] 2.3 Read back through short-lived links
- [ ] 2.4 Registration succeeds with no photographs; they can be added later

## 3. Who may

- [ ] 3.1 Portal token: its own tenancy only — create, list, cancel
- [ ] 3.2 Owner anywhere; manager within their buildings; maintenance nowhere
- [ ] 3.3 Another tenancy's registration reads as absent through a portal token
- [ ] 3.4 A revoked link cannot register

## 4. The fourteen-day flag

- [ ] 4.1 An open stay past fourteen days is reported overlong, measured to today
- [ ] 4.2 A finished long stay is marked but is not an open question
- [ ] 4.3 Tenancies holding an overlong stay are findable
- [ ] 4.4 Nothing happens automatically — count, charges and the registration all unchanged

## 5. It touches no money

- [ ] 5.1 Registering changes no occupant count
- [ ] 5.2 The next invoice charges water for the same number of people as before
- [ ] 5.3 No customer record is created

## 6. The screens

- [ ] 6.1 Portal page: why it is asked, the fields, both ID sides, progress per side
- [ ] 6.2 Portal: the tenant's own history, finished stays included
- [ ] 6.3 Tenancy page: registrations, apart from the occupant list, with their state
- [ ] 6.4 The overlong mark names the consequence and offers to correct the occupant count
- [ ] 6.5 Staff can add one, shown as added by staff
- [ ] 6.6 A tenancy with none says so

## 7. Strings

- [ ] 7.1 New Vietnamese strings reported for review

## 8. Checks

- [ ] 8.1 `tsc --noEmit`, `codes:check`, `atomic:check`, frontend lint and build
- [ ] 8.2 From a REAL portal link at 390px: register somebody, see them listed
- [ ] 8.3 Confirm the tenancy's occupant count and the next invoice's water are unchanged
- [ ] 8.4 A stay dated fifteen days back shows the mark; three days back does not
- [ ] 8.5 Another tenancy's registration is unreachable through the wrong token
- [ ] 8.6 Photographs: verify presence, type and size ONLY — the images are not opened
- [ ] 8.7 1440px and 390px
