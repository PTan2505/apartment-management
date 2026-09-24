## Context

`findLatestKnownReading` gathers dated candidates — the room's opening reading,
the latest lease's opening and closing readings, the latest vacancy expense —
and returns the most recent. Invoices were never among them, although a monthly
invoice records exactly this: the meter at the end of the period it bills.

The refusal on the other side (`METER_BELOW_INVOICED`) compares against the
lease's last invoiced reading. So the two sides of the same screen have been
reading different histories.

## Goals / Non-Goals

- Goal: one history. What the screen offers can never be below what the API
  accepts.
- Non-Goal: changing the refusal. It is right; the hint was wrong.
- Non-Goal: a new endpoint or field. The reading already has a `source`, which
  gains one more value.

## Decisions

### The invoiced reading is dated at the END of the period it billed

Not the issue date, which is when the bill was written rather than when the
meter was read, and can be weeks later. Dating it at `periodEnd` puts it in the
right order against a vacancy reading or a move-out on either side of it.

An invoice with a reading but no period falls back to its issue date rather than
being dropped — a candidate with no date cannot be compared, and dropping it
would reintroduce the gap this closes.

### One query, the latest only

The same shape as the other candidates: `findFirst` ordered by period end. The
question is "what is the most recent reading", not "what is the history".

### The lease used is the room's latest, the invoice is the room's latest

The existing lease candidate is the room's latest lease. The invoice candidate
is likewise the room's latest invoiced reading, whichever tenancy issued it —
a previous tenancy's final bill is still a reading of that meter.

## Risks / Trade-offs

- **A room's position can now move forward without a move-out.** That is the
  point, and it is what makes the vacancy calculation correct too: a tenancy
  billed to September leaves the meter at September's reading, not June's.
- **`source` gains values a client might switch on.** Nothing renders it today;
  the frontend type is corrected in the same change (it was already missing
  `room_initial`).
