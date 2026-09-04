## Context

See proposal.md — Why. What shapes the approach:

- `findLatestKnownReading` already resolves a room's meter position from three dated candidates and returns the most recent. Adding a fourth is an entry in that list, not a new mechanism.
- The vacancy round already excludes rooms with no known reading, and `recordVacancyElectricity` already refuses them. That exclusion exists *only* because such rooms had no baseline.
- Lease creation already requires an opening reading when the room has none, and defaults from the room's position when it has one.
- Rooms exist in production and locally with no reading, and no figure can be invented for them.

## Goals / Non-Goals

**Goals:**

- Give a brand-new room a meter position, so its empty months are costable.
- Do it in one place, at the moment the owner is looking at the meter.
- Change nothing about how consumption is computed.

**Non-Goals:**

- Requiring the figure, or backfilling it.
- Editing it afterwards.
- Any change to charges, proration, or the vacancy calculation itself.

## Decisions

**A fourth candidate in the existing resolution, not a special case.**

`findLatestKnownReading` compares dated candidates and returns the newest. The room's opening reading joins that list dated at the room's creation, which makes it lose automatically to any tenancy or vacancy reading — because those are always later. On a never-let room it wins by being the only one.

The alternative is a fallback consulted when the other three come back empty. Same result today, but it is a second code path that gets to disagree with the first: a room created in March, let in January by back-dated entry, would resolve differently under the two. Ordering by date is the rule the function already applies, and applying it uniformly is what keeps the answer explainable.

**Nullable, not defaulted to zero. Zero is a value an owner may state.**

This is the whole reason the change exists in this shape rather than as a default. A room is often new to the SYSTEM rather than new in the world: an owner bringing an existing building into this software creates rooms whose meters have read for years. Defaulting those to zero charges the meter's entire history as one month's cost, from a figure nobody entered.

So: no reading is `null`, meaning "nobody has said"; and `0` is a statement that the meter reads zero. Distinguishing them is exactly what a nullable column does and a defaulted one cannot.

**The vacancy exclusion narrows rather than disappears.**

A room can still have no reading anywhere — one added before this change, or one created without stating a figure. Those must stay excluded, because recording a vacancy for them is still refused, and the listing must never offer a row that cannot be acted on. What changes is that this stops being the ordinary state of a new room and becomes a residual case.

**Not editable.**

The figure describes a moment. Once a lease or vacancy record exists, the room's position comes from those, so editing it would change nothing visible — an edit that silently does nothing is worse than no edit. And on a room where it IS the current position, editing it would rewrite the basis of costs already recorded against it. Correcting those is done by correcting the records that hold them, which is already possible.

## Risks / Trade-offs

**An owner skips the field and loses the same months as before** → The field explains what it buys, which is the most that can be done without making it required — and requiring it would mean inventing figures for every existing room.

**An owner types the meter's serial number, or a reading in the wrong unit** → Not detectable. The first vacancy record made from it will produce an obviously wrong consumption, and that expense is correctable, which is the same recourse every other mistyped reading has.

**Back-dated data resolves oddly** → Handled by ordering rather than by precedence: whichever reading is dated latest wins, which is the rule that already governs the other three.

## Migration Plan

One additive nullable column, no backfill. Existing rooms keep no reading and behave exactly as they do today. Rollback is reverting the commit; nothing reads the column before this change.
