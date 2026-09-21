## 1. Date helpers

- [x] 1.1 A helper in `dates.ts` comparing a move-out with the agreed end as date-only UTC values: early, on time, or late — equal is on time
- [x] 1.2 Update the `dates.ts` header to record that the move-out field shows the handed-back day by design, with the covered-through date beneath it

## 2. Terms card

- [x] 2.1 `Field` accepts a hint of one or two lines; existing single-string uses unchanged
- [x] 2.2 "Ngày bắt đầu hiệu lực" → "Ở từ ngày" (cancelled keeps "Dự kiến bắt đầu")
- [x] 2.3 "Ngày kết thúc thoả thuận" → "Hợp đồng đến hết ngày"; hint "Thoả thuận N tháng" (cancelled keeps its hint)
- [x] 2.4 "Thực tế đến hết" → "Đã trả phòng ngày", value = the handed-back day
- [x] 2.5 Its hint: "Ở đến hết {last day covered}", then "Trả phòng trước hạn hợp đồng" / "Trả phòng đúng hạn hợp đồng" / "Ở quá hạn hợp đồng"

## 3. Occupants and departure

- [x] 3.1 Occupant row: "Rời ngày" → "Rời đi ngày"
- [x] 3.2 Departure dialog: body text, date helper and transfer alert in Vietnamese, per design.md
- [x] 3.3 Fallback names "this person" → "Người này", "Customer #id" → "Khách #id"
- [x] 3.4 No English sentence remains in the dialog — scan the rendered text, not the source

## 4. Local documents (not committed)

- [x] 4.1 `TEST-THU-CONG.md` 5.4 quotes the new labels — the only line in either local document that names the old ones (checked with grep: 5.5 and `SCREENS.md` do not)
- [x] 4.2 `TEST-THU-CONG.md` 5.5 gains a line for what an ended tenancy now shows: the handed-back day, the last day covered, and early / on time / late
- [x] 4.3 Both documents remain gitignored and untracked

## 5. Checks

- [x] 5.1 `tsc --noEmit`, lint and a production build pass

## 6. Verify in a visible browser, signed out at the start

- [x] 6.1 Running tenancy (B2-01): "Ở từ ngày 01/06/2026", "Hợp đồng đến hết ngày 31/05/2027", "Thoả thuận 12 tháng"; no move-out field
- [x] 6.2 Early (P302): "Đã trả phòng ngày 01/09/2026", "Ở đến hết 31/08/2026", "Trả phòng trước hạn hợp đồng"
- [x] 6.3 On time: a tenancy whose move-out equals its agreed end reads "Trả phòng đúng hạn hợp đồng" — find one in the data or create it — Q54299A (#221), a renewal closed on its boundary: "Đã trả phòng ngày 12/09/2027 · Ở đến hết 11/09/2027 · Trả phòng đúng hạn hợp đồng"
- [x] 6.4 Late: a tenancy moved out after its agreed end reads "Ở quá hạn hợp đồng" — none existed; created LATE3448 (#239): 1-month tenancy from 01/06/2026, agreed end boundary 01/07/2026, moved out 15/07/2026. Reads "Đã trả phòng ngày 15/07/2026 · Ở đến hết 14/07/2026 · Ở quá hạn hợp đồng"
- [x] 6.5 On P302, the occupant's "Rời đi ngày" shows the same date as "Đã trả phòng ngày"
- [x] 6.6 Cancelled (Q54299E): "Dự kiến bắt đầu" and "Ngày huỷ" unchanged
- [x] 6.7 Open "Ghi nhận rời đi" on a running tenancy: read the rendered text back and confirm no English; cancel without saving
- [x] 6.8 Every value read back from the page and compared with the API, not eyeballed
- [x] 6.9 390px, scrolled: labels and two-line hints wrap without overflow, measured at scroll positions that actually differ — P302 at 5 positions, scrollWidth 390; the move-out field x 33..357 with both hint lines; the occupant's "Rời đi ngày" line ends at x 301. Touch emulation off

## 7. Found during verification

- [x] 7.1 Two more English fallbacks of the same kind as the one in the departure dialog: `Customer #id` in the occupant row and in the transfer dialog. Both now "Khách #id" — found by scanning for the fragments this change translated, not by reading the plan
- [x] 7.2 Every occupant row on the early, on-time and late tenancies shows "Rời đi ngày" on exactly the date of "Đã trả phòng ngày" — the stored day is the same, and now it reads the same
