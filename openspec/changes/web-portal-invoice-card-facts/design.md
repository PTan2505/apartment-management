## Context

`PortalInvoice` on the frontend declares neither `buildingName` nor `settledAt`, so both arrive from the mapper and are dropped. The card's second row currently reads `Phòng {roomCode} · {issueDate}`.

## Goals / Non-Goals

**Goals.** Name the building. Say when a settled bill was settled, and stay silent where the date is genuinely absent.

**Non-Goals.** No backend change. No change to what the card shows for an unpaid bill beyond leaving it as it is.

## Decisions

**The building joins the room, not the date.** `Phòng {roomCode} · {buildingName} · {issueDate}` keeps the place together and the date at the end, where it already was. Putting the building last would split the two halves of "which room, where" around a date.

**`settledAt` renders beside the "Đã trả" chip, not in the money column.** The chip already answers whether; the day belongs with it. In the money column it would sit under "Tổng cần nộp", which is the amount's label and not a date's.

**Null `settledAt` on a paid bill renders nothing extra, and the chip stands alone.** Not "Đã trả · không rõ ngày": that names a gap the tenant can do nothing about, on the screen they came to for reassurance. The chip already says the true thing.

**`buildingName` is typed non-null; `settledAt` is nullable.** The mapper reads the building through a required relation, so a bill cannot exist without one. `settledAt` is null both for unpaid bills and for settled ones with no dated payment, so the type carries the case the screen has to handle.

## Risks / Trade-offs

**A third item on one line, at 390px.** The portal is a phone-first screen and this row is already two items plus an amount. The row wraps rather than truncating, and the mobile pass measures overflow at positions that actually differ rather than assuming.
