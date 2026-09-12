## Context

`dates.ts` converts every exclusive ending — `expectedEndDate`, `moveOutDate` — into the last day covered, and the terms card shows only that converted date. `OccupantsCard` prints `joinedAt` and `leftAt` unconverted. On move-out and on renewal the API sets every current occupant's `leftAt` to the lease's exclusive boundary, so on an ended tenancy the occupant's departure and the lease's handed-back day are the same stored value, displayed a day apart.

The terms card's hint compares only `moveOutDate > expectedEndDate`, so early and on-time both fall into "Trả phòng trong hạn".

`DepartOccupantDialog` carries half-English sentences from before the Vietnamese pass: the body text, the helper under the date, the transfer alert, and two fallback names.

## Goals / Non-Goals

**Goals.** Labels that name what each date is. The handed-back day and the last day covered shown together. Early, on time and late told apart. One convention for "left" across the lease and its occupants. A fully Vietnamese departure dialog.

**Non-Goals.** No API or schema change. No change to the list's "Thời gian ở" column, to cancelled-tenancy wording, or to how dates are stored or billed.

## Decisions

**Labels, chosen by the owner from a preview:**

| Field | Was | Becomes |
|---|---|---|
| start (running or ended) | Ngày bắt đầu hiệu lực | Ở từ ngày |
| agreed end | Ngày kết thúc thoả thuận | Hợp đồng đến hết ngày |
| agreed end hint | N tháng kể từ ngày bắt đầu | Thoả thuận N tháng |
| move-out | Thực tế đến hết · value = last day covered | Đã trả phòng ngày · value = handed-back day |
| move-out hint | Trả phòng trong hạn / Ở quá hạn thoả thuận | Ở đến hết {last day covered} · then one of: Trả phòng trước hạn hợp đồng / Trả phòng đúng hạn hợp đồng / Ở quá hạn hợp đồng |
| occupant row | Vào ở … · Rời ngày … | Vào ở … · Rời đi ngày … |

Cancelled variants are unchanged: "Dự kiến bắt đầu", "Ngày huỷ", and the agreed-end hint "Đây là thoả thuận. Không có ngày nào thực sự ở".

**The move-out field's VALUE is the stored date, and its hint carries the converted one.** This is the only place `moveOutDate` is formatted without `coveredThrough`, and it is deliberate: the label says "Đã trả phòng ngày", which is exactly what the exclusive boundary is. The rule in `dates.ts` — never present an exclusive end as though the tenancy runs through it — still holds, because the label no longer claims that it does, and the covered-through date sits directly beneath. The file's header comment is updated to say so, so the next reader does not "fix" it back.

**Early / on time / late is one helper in `dates.ts`**, comparing the two exclusive boundaries as date-only UTC values: before, equal, after. Equal is on time — both mean the first day not covered is the same day. It lives beside `isTermRunOut` because it is the same kind of comparison, and the terms card should not hold date arithmetic.

**`Field` takes a hint that can be two lines.** The move-out hint is two facts — the last day covered, and how that compares with the agreement — and joining them into one sentence makes the date hard to find. The existing single-string use is unchanged.

**The occupant row keeps its dates unconverted.** `leftAt` is the first day gone, which "Rời đi ngày" names correctly, and on an ended tenancy it equals "Đã trả phòng ngày" above it. Converting it to a last day would bring back the one-day mismatch from the other direction.

**The departure dialog's date is explained, not changed.** It still sends the date typed. The helper says it is the day the person no longer lives there and that it cannot precede their joining date.

**Translations for the departure dialog:**

- body: "{tên} sẽ được ghi là đã rời đi. Người này vẫn nằm trong danh sách của hợp đồng — ai từng ở và ở khi nào chính là thứ hồ sơ này cần lưu."
- date helper: "Ngày người này không còn ở nữa. Không được trước ngày vào ở {ngày}."
- transfer alert: "{tên} đang đứng tên hợp đồng này, và vẫn còn người khác ở đây. Chọn người nhận đứng tên thay trước khi ghi nhận rời đi."
- fallback name: "Người này"; fallback candidate: "Khách #{id}"

## Risks / Trade-offs

**Existing strings change.** Done on the owner's instruction after a preview; the local manual test script quotes the old labels in 5.4 and is updated alongside, uncommitted.

**Longer labels at 390px.** The date fields already stack to one column at that width, and the two-line hint wraps rather than truncates. Measured, not assumed.

**"Đúng hạn" depends on exact equality.** A move-out one day late reads as late. That is what the dates say, and softening it would recreate the conflation this change removes.
