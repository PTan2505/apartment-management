## 1. The API can answer the question

- [x] 1.1 `type` accepted as a filter on the invoice listing
- [x] 1.2 `sort` accepted: owing (default), newest, oldest
- [x] 1.3 Live bills sort before withdrawn ones in every order
- [x] 1.4 Every order is total, with id as the last key

## 2. The list says what each row is

- [x] 2.1 A kind column, named in Vietnamese with the words the rest of the application uses
- [x] 2.2 An issue-date column
- [x] 2.3 The phone layout carries both without crowding

## 3. The owner can ask

- [x] 3.1 A kind filter beside the existing filters, defaulting to all
- [x] 3.2 An order control: what is owed / newest / oldest
- [x] 3.3 Both survive a page change and a reload, like the filters already do

## 4. Strings

- [x] 4.1 New Vietnamese strings reported for review

## 5. Checks

- [x] 5.1 `tsc --noEmit` both sides, lint, both builds

## 6. Verify in a visible browser

- [x] 6.1 Each kind appears on its rows, matching what the bill itself says
- [x] 6.2 Filtering by kind leaves only that kind — checked against the API's own count
- [x] 6.3 The default order puts unpaid first and the newest of those at the top
- [x] 6.4 Switching to oldest-first re-fetches rather than reordering the page — proven by hooking fetch/XHR and reading the request that went out (`sort=oldest`)
- [x] 6.5 Withdrawn bills, when shown, sit after the live ones
- [x] 6.6 390px
