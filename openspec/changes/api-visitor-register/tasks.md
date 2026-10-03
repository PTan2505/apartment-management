## 1. The record

- [x] 1.1 `LeaseVisitor` — name, document number, two image keys, start, expected end, note, who added it
- [x] 1.2 Expected end date required; migration
- [x] 1.3 A fifth key prefix, content-type set and ceiling in the storage helpers
- [x] 1.4 The fields the form requires: date of birth, sex, permanent residence, relationship to the signatory — all required
- [x] 1.5 The fields the form tolerates empty: telephone, email, occupation — all optional
- [x] 1.6 `User.idCardNumber`, nullable; written by the customer create and update paths

## 2. Registering

- [x] 2.1 Create, edit while current or upcoming, cancel
- [x] 2.2 Sign and confirm an upload per side; bytes never through the API
- [x] 2.3 Read back through short-lived links
- [x] 2.4 Registration succeeds with no photographs; they can be added later

## 3. Who may

- [x] 3.1 Portal token: its own tenancy only — create, list, cancel
- [x] 3.2 Owner anywhere; manager within their buildings; maintenance nowhere
- [x] 3.3 Another tenancy's registration reads as absent through a portal token
- [x] 3.4 A revoked link cannot register

## 4. The fourteen-day flag

- [x] 4.1 An open stay past fourteen days is reported overlong, measured to today
- [x] 4.2 A finished long stay is marked but is not an open question
- [x] 4.3 Tenancies holding an overlong stay are findable
- [x] 4.4 Nothing happens automatically — count, charges and the registration all unchanged

## 5. It touches no money

- [x] 5.1 Registering changes no occupant count
- [x] 5.2 The next invoice charges water for the same number of people as before
- [x] 5.3 No customer record is created

## 6. The blank residence form

- [x] 6.1 A sixth key prefix; one object, replaced not versioned, like the blank contract
- [x] 6.2 Owner uploads, replaces, downloads and deletes it; manager may download only
- [x] 6.3 Nothing on file reads as absent, and a filing is refused rather than improvised
- [x] 6.4 A template holding the full placeholder set, for verifying the filler

## 7. Filling it

- [x] 7.1 Resolve the payload: declarant, head of household, address of stay, co-arrivals
- [x] 7.2 Head of household is the lease signatory, never the landlord
- [x] 7.3 Several registrations in one document; the first is the declarant
- [x] 7.4 Report every box that could not be filled; invent nothing
- [x] 7.5 Fill the `.docx` and stream it; the document is never stored
- [x] 7.6 A visitor on another tenancy, a cancelled one, or none at all is refused
- [x] 7.7 Owner anywhere; manager in their buildings; maintenance and portal token nowhere

## 8. The screens

- [x] 8.1 Portal page: why it is asked, the fields, both ID sides, progress per side
- [x] 8.2 Portal: the tenant's own history, finished stays included
- [x] 8.3 Portal: one line saying what the extra boxes are for; optional fields visibly optional
- [x] 8.4 Tenancy page: registrations, apart from the occupant list, with their state
- [x] 8.5 The overlong mark names the consequence and offers to correct the occupant count
- [x] 8.6 Staff can add one, shown as added by staff
- [x] 8.7 A tenancy with none says so
- [x] 8.8 Tenancy page: select registrations and download the filing
- [x] 8.9 Missing boxes named BEFORE the download, with a way to record the signatory's number
- [x] 8.10 No blank form on file says so and offers no download
- [x] 8.11 Customers screen: the document number on the add and edit forms, saying what it is for

## 9. Strings

- [x] 9.1 New Vietnamese strings reported for review

## 10. Checks

- [x] 10.1 `tsc --noEmit`, `codes:check`, `atomic:check`, frontend lint and build
- [x] 10.2 From a REAL portal link at 390px: register somebody, see them listed
- [x] 10.3 Confirm the tenancy's occupant count and the next invoice's water are unchanged
- [x] 10.4 A stay dated fifteen days back shows the mark; three days back does not
- [x] 10.5 Another tenancy's registration is unreachable through the wrong token
- [x] 10.6 Photographs: verify presence, type and size ONLY — the images are not opened
- [x] 10.7 Upload a blank form, produce a filing, OPEN the result and read the filled values back
- [x] 10.8 A filing with the signatory's number missing: box empty, named on screen first
- [x] 10.9 Three registrations produce one document carrying all three
- [x] 10.10 1440px and 390px
