## 1. Shared table treatment

- [x] 1.1 Set the table's row height, header treatment and column padding in `theme.ts` so they apply to every table, using the density the design shows
- [x] 1.2 Confirm money still aligns as a column: `fontVariantNumeric: tabular-nums` is already on `MuiTableCell`, so verify it survives rather than adding it twice
- [x] 1.3 Open Toà nhà, Phòng, Khách and Hợp đồng and check the new density suits them too — a density that only suits invoices is the wrong density and belongs on the screen instead

## 2. The invoice screen's surface

- [x] 2.1 Put the filter row and the desktop table on one `Paper variant="outlined"`, so the filters read as describing the table beneath them
- [x] 2.2 Leave the below-`md` card list without an outer surface, at the same breakpoint `InvoiceList` already switches on, so the cards are not framed inside a second frame
- [x] 2.3 Move the empty state ("Chưa có hoá đơn nào") onto that same surface, where the table would have been

## 3. Rows and status

- [x] 3.1 Give the payment status column enough width for the longest Vietnamese status, and stop the pill wrapping — deliberately departing from the mock, where "Đã thu đủ" breaks across three lines
- [x] 3.2 Mark the row under the pointer, using the accent tint the design shows on its selected row. Not keyboard focus: the rows are not keyboard-reachable today, and making them so is the design's keyboard navigation, which is deferred
- [x] 3.3 Translate the status filter's "all" option, which reads `All` — an existing breach of the requirement that every string is in Vietnamese, on the screen already being opened

## 4. Verification

- [x] 4.1 `npx tsc --noEmit` passes
- [x] 4.2 Open `/invoices` at 1440px against the design and note every remaining difference, rather than declaring it matched
- [x] 4.3 Open `/invoices` at 390px and confirm the card list is unchanged and nothing overflows sideways
- [x] 4.4 Exercise the screen's behaviour, which this change must not have altered: filter by building, by room, by month, by status, toggle "Kể cả đã rút", and open a bill
- [x] 4.5 Confirm no file under `features/` or `layouts/` gained a hardcoded colour, radius or font size — the spec's rule is that those come from the theme
