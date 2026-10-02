## 1. Storage and the record

- [ ] 1.1 `RoomPhoto`, shaped like `DamageReportPhoto`, with its migration
- [ ] 1.2 A fourth prefix, content-type set and ceiling in the storage helpers

## 2. The endpoints

- [ ] 2.1 Sign an upload URL for a room; refuse a type that is not an accepted image
- [ ] 2.2 Confirm an upload only once the object is really in storage
- [ ] 2.3 List a room's photographs with short-lived links
- [ ] 2.4 Remove one, from the record and from storage
- [ ] 2.5 Owner and manager may write; both may read; maintenance reaches none
- [ ] 2.6 A room outside a manager's buildings reads as absent, as everywhere else
- [ ] 2.7 Storage not configured says so rather than failing oddly

## 3. The screens

- [ ] 3.1 The room page shows them, full size on click
- [ ] 3.2 Adding several at once, with progress, naming any that failed
- [ ] 3.3 Removing, confirmed
- [ ] 3.4 The rooms list shows the first, with a placeholder that keeps the row height
- [ ] 3.5 A room with none says so
- [ ] 3.6 No upload control where storage is unconfigured, or for a role that may not

## 4. Strings

- [ ] 4.1 New Vietnamese strings reported for review

## 5. Checks

- [ ] 5.1 `tsc --noEmit`, `codes:check`, `atomic:check`, frontend lint and build
- [ ] 5.2 In a visible browser: upload a real image, see it on the page and in the list
- [ ] 5.3 Remove it and confirm it is gone from both
- [ ] 5.4 As a MANAGER: can upload; as MAINTENANCE: refused
- [ ] 5.5 Measure what a twenty-row list costs with photographs before calling it done
- [ ] 5.6 1440px and 390px
