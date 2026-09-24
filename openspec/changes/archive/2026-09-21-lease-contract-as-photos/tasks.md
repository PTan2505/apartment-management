## 1. Pages instead of one file

- [x] 1.1 `LeaseContractPage` model, migration, `Lease.contractKey` dropped
- [x] 1.2 Only image types accepted; PDF and Word refused when the URL is requested
- [x] 1.3 Confirmation records a page rather than replacing one
- [x] 1.4 Removing one page deletes its object and leaves the others
- [x] 1.5 Cleanup compares storage against the page rows, not against one key

## 2. The API reports pages

- [x] 2.1 A tenancy reports how many pages it carries, without a storage location
- [x] 2.2 The pages are listed in order, each with a short-lived signed link
- [x] 2.3 Owner-only, and storage-unconfigured still refused plainly

## 3. The screen

- [x] 3.1 Pages shown as images in order, one tap to full size
- [x] 3.2 Several chosen and uploaded in one go, in sequence, with progress
- [x] 3.3 Add later; remove one, confirmed first
- [x] 3.4 A part-way failure names the page that failed and keeps the rest
- [x] 3.5 The signing form uploads its pages the same way

## 4. Strings

- [x] 4.1 New and changed Vietnamese strings reported for review

## 5. Checks

- [x] 5.1 `tsc --noEmit` both sides, lint, both builds, `codes:check`, `atomic:check`

## 6. Verify against the real bucket

- [x] 6.1 Three pages uploaded: three objects, three rows, in order
- [x] 6.2 Removing the middle one leaves two objects and two rows
- [x] 6.3 A PDF is refused before any URL is issued
- [x] 6.4 An unconfirmed object is cleared by the next confirmation, and recorded pages are not

## 7. Verify in a visible browser

- [x] 7.1 Several photographs chosen at once appear as images, in order
- [x] 7.2 A page opens full size
- [x] 7.3 Adding later joins rather than replaces
- [x] 7.4 Removing one asks first, then leaves the others
- [x] 7.5 A failure mid-run names the page and keeps the others — three pages with an oversized one in the middle: two attached, two objects in the bucket, and the screen said which count failed
- [x] 7.6 390px
