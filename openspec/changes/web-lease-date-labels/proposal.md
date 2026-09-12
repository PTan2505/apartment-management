## Why

The owner read "Thực tế đến hết 31/08/2026" on an ended tenancy and could not tell what it meant. The label names neither what ended nor that the date is the last day lived there.

The screen also mixes two conventions. The system stores the day a room was handed back — 01/09/2026 for P302 — as the first day no longer covered. The terms card converts it to the last day covered, 31/08/2026, while the occupant row directly below prints the stored date unchanged, "Rời ngày 01/09/2026". Both are correct, and side by side they read as two dates that disagree by a day.

And the hint under that date says "Trả phòng trong hạn" for P302, which was handed back nine months before its agreement ended. The code only distinguishes "past the term" from "not past the term", so an early departure and an on-time one read the same — which the existing spec already forbids.

## What Changes

- Every tenancy date is labelled by what it is to the owner: the first day lived there, the last day the agreement covers, and — for an ended tenancy — the day the room was handed back, with the last day covered shown beneath it.
- The ended-tenancy hint distinguishes handing back early, on the day the agreement ended, and late.
- The occupant row names its departure "Rời đi ngày", the same convention as the handed-back day, so the two agree on one screen.
- The "Ghi nhận rời đi" dialog explains which date it asks for, and its English sentences — left half-translated — become Vietnamese.

## Deliberately not changed

**What is stored.** No API or data change. The dates are the same; only how they are named and paired changes, which is presentation and belongs where `dates.ts` already converts them.

**The list's "Thời gian ở" column.** It shows the range lived there as first day – last day covered, which is already unambiguous in a column of ranges.

**Cancelled tenancies.** "Dự kiến bắt đầu", "Ngày huỷ" and their hints stay: they already say that nobody lived a day of it.

## Capabilities

### Modified Capabilities

- `web-leases`: tenancy and occupant dates are labelled by what they mean, an ended tenancy shows the handed-back day and the last day covered together, and early, on-time and late departures are told apart.

## Impact

- `frontend/src/features/leases/` — the terms card, the occupants card, the departure dialog, and a small helper in `dates.ts` for comparing a departure with the agreed end.
- Existing Vietnamese strings change, on the owner's instruction: the date labels and hints on the terms card and the occupant row.
- The local-only `TEST-THU-CONG.md` quotes the old labels in step 5.4 and needs updating; it is not committed. `SCREENS.md` does not name them.
