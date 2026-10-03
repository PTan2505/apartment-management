## 1. Storage and the record

- [x] 1.1 `RoomPhoto`, shaped like `DamageReportPhoto`, with its migration
- [x] 1.2 A fourth prefix, content-type set and ceiling in the storage helpers

## 2. The endpoints

- [x] 2.1 Sign an upload URL for a room; refuse a type that is not an accepted image
- [x] 2.2 Confirm an upload only once the object is really in storage
- [x] 2.3 List a room's photographs with short-lived links
- [x] 2.4 Remove one, from the record and from storage
- [x] 2.5 Owner and manager may write; both may read; maintenance reaches none
- [x] 2.6 A room outside a manager's buildings reads as absent, as everywhere else
- [x] 2.7 Storage not configured says so rather than failing oddly

## 3. The screens

- [x] 3.0 A room detail page at `/rooms/:id` — it did not exist; rows opened the tenancy
- [x] 3.1 The room page shows them, full size on click
- [x] 3.2 Adding several at once, with progress, naming any that failed
- [x] 3.3 Removing, confirmed
- [x] 3.4 The rooms list shows the first, with a placeholder that keeps the row height
- [x] 3.5 A room with none says so
- [x] 3.6 No upload control where storage is unconfigured, or for a role that may not

## 4. Strings

- [x] 4.1 New Vietnamese strings reported for review

## 5. Checks

- [x] 5.1 `tsc --noEmit`, `codes:check`, `atomic:check`, frontend lint and build
- [x] 5.2 In a visible browser: upload a real image, see it on the page and in the list
- [x] 5.3 Remove it and confirm it is gone from both
- [x] 5.4 As a MANAGER: can upload; as MAINTENANCE: refused
- [x] 5.5 Measure what a twenty-row list costs with photographs before calling it done
- [x] 5.6 1440px and 390px
