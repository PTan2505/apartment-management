## Why

A room's electricity is always charged as a **difference** — a closing reading minus an opening one. The system learns that opening figure in three ways, and every one of them requires the room to have already been used: a lease's opening reading, a lease's closing reading, or a vacancy record. A room that has just been added to the system has none of them, and therefore has no baseline at all.

That produces a gap nobody can work around:

```
A room is created and stands empty for three months before it is first let.
Its meter runs the whole time. The owner pays for that electricity.
Nothing in the system will let them record it.
```

The vacancy round refuses such a room outright — correctly, because subtracting from nothing is not a calculation — and so the cost is simply lost. That was accepted when the vacancy round was built, on the grounds that a room's first reading is taken when it is first let. It is not good enough: the months before that first letting are real, and the owner bears them.

**The fix belongs where the room enters the system.** A meter has a reading on the day the room is created, the owner is standing in front of it, and asking once is cheaper than asking every month thereafter. Every later reading is a difference from something — this is the only one that is not, so it is the only one that has to be stated rather than derived.

Assuming zero instead is the alternative, and it is worse than the gap. A room is often new *to the system* rather than new in the world: an owner bringing an existing building into this software creates rooms whose meters have been running for years. Defaulting those to zero charges the owner for the meter's entire history as one month's cost — tens of millions of dong appearing as a single month's loss, from a figure nobody typed.

## What Changes

- **A room records the meter reading it was at when it was added.** Optional, because rooms already exist without one and no reading can be invented for them, but offered every time a room is created.
- **That reading becomes a fourth source for the room's meter position**, alongside the three that already exist, and is used exactly as they are: the most recent known reading wins. On a brand-new room it is the only one, which is the point.
- **A never-let room can therefore have its vacancy electricity recorded**, and appears in the month-end round like any other empty room. The exclusion added when that round was built stops being necessary — it existed only because such rooms had no baseline.
- **A room's first lease can default its opening reading** from the room's recorded figure, instead of requiring the owner to type it again. They already told the system what the meter said.
- The room form asks for it, explaining that it is what the meter reads today and that it is only ever used as a starting point.

Deliberately NOT in this change:

- **Requiring it.** Rooms exist today with no reading, and a required field would mean inventing a number for each of them during a migration — the same lie this change exists to avoid.
- **Editing it after the fact.** A room's opening reading is a statement about a moment. Once a lease or a vacancy record exists, the room's position comes from those instead, and correcting history is done by correcting the record that holds it.

## Capabilities

### Modified Capabilities

- `room`: a room records the meter reading it was added at, and that reading counts as a known position for the room.
- `expense`: a room whose only known reading is its own opening figure is no longer excluded from the month-end vacancy round.
- `web-rooms`: the room form takes the meter reading, and explains what it is for.

## Impact

- `backend/prisma/schema.prisma` — a room needs to record its opening reading. Migration required.
- `backend/src/lib/meter-history.ts` — a fourth source for the room's meter position.
- `backend/src/modules/rooms/` — accepting and reporting it.
- `backend/src/modules/expenses/` — the exclusion that this change makes unnecessary.
- `frontend/src/features/rooms/` — the field and its explanation.
- No change to how any consumption is computed. Every charge is still a difference between two readings; this change only supplies the first one.
