## Context

`GET /rooms?vacant=true` returns rooms with no OPEN tenancy — `leases: { none: HOLDS_ITS_ROOM }`. The signing form asks for it once, when it opens, and offers whatever comes back.

The API's own rule for a new tenancy is different and dated: it refuses a start date earlier than the greatest `moveOutDate` among the room's non-cancelled leases, and allows equality, because an ending date is the first day no longer covered. Cancelled tenancies are excluded entirely — they covered no days.

So the form's list and the API's rule answer two different questions, and the owner meets the difference as a refusal after filling in twelve fields.

## Goals / Non-Goals

**Goals.** Offer exactly the rooms a tenancy beginning on the chosen date can use. Ask the date first, because it is what makes the room question answerable.

**Non-Goals.** No calendar of future vacancies, no "available from" column on the rooms screen, no suggesting the earliest date a chosen room could take. Each is a different screen's question.

## Decisions

### `availableOn`, a new filter beside `vacant`

`vacant=true` stays and keeps its meaning: free right now, which is what the rooms screen shows. The signing form stops using it.

The new filter reads as: in service, no open tenancy, and no non-cancelled tenancy whose `moveOutDate` is later than the named date. Expressed against Prisma that is a `none` on leases matching "open OR (not cancelled AND moveOutDate > date)".

Putting both rules in one filter rather than two flags is deliberate: they are one question — can this room take a tenancy starting then — and a caller combining `vacant` with a date would be reconstructing a rule the API already knows.

### The date leads the form

Moving the field is the whole point, not decoration. A form that asks for a room first has already asked the owner to answer an unanswerable question, and every later field is filled in under an assumption that may not hold.

Until the date is filled in, the room select is disabled and says the date comes first. An empty select that looks operable is a worse answer than one that explains itself.

### A date change re-asks, and can clear the room

The room query keys on the date, so changing the date re-fetches. If the chosen room is not in the new answer, it is cleared and a line appears saying so.

Clearing silently would be the wrong kind of quiet: the owner would submit a form they believe still names a room. Keeping an invalid room would move the refusal to the end, which is what this change exists to remove.

### A room arrived with is kept

Opening the form from a room — the rooms screen's "sign a tenancy here" — carries a room in. That room stays chosen even before a date is entered; the owner picked it deliberately from a screen that was about it. The date is still asked for, and if the date makes that room impossible, the same clearing rule applies with the same message.

## Risks / Trade-offs

**A room that becomes free later is still not offered for an earlier date.** Correct — the API would refuse it — but an owner who wants "the soonest this room could start" is not answered here. That is the future-vacancies screen, and nobody has asked for it.

**One more request when the date changes.** A few hundred bytes, on a form that already asks for the meter reading and the building rates when a room is chosen.
