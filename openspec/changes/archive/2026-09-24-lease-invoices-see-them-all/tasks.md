## 1. The row

- [x] 1.1 The invoice row and its payment chip extracted, used by the panel

## 1b. The panel

- [x] 1b.1 The panel lists only what is owed, and says the total either way
- [x] 1b.2 A fully settled tenancy says so instead of reading as never billed

## 2. The dialog

- [x] 2.1 "Xem tất cả" on the panel, opening every bill of the tenancy
- [x] 2.2 Paged and ordered by the API, with the shared pager
- [x] 2.3 The total count stated; a row opens that invoice
- [x] 2.4 The panel's partial-list note points at the dialog

## 3. Checks

- [x] 3.1 `tsc --noEmit`, lint, build
- [x] 3.2 Verified in a visible browser at 1440px and 390px: opening, paging, and following a row
