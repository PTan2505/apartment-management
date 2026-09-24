## Why

The signing form asks for the room first and the start date fourth, and the rooms it offers are the ones vacant **today**.

Those two facts disagree with the rule the API enforces. A tenancy may not begin before the room's previous one ended, so a room whose tenant leaves on 30 October is a perfectly good room for a tenancy starting 1 November — and the form will not offer it, because today it is occupied. Meanwhile a room that is free today is offered for a start date in September that it cannot take, and the owner finds out after filling in the whole form: *"Hợp đồng mới không thể bắt đầu trước ngày hợp đồng trước của phòng kết thúc."*

Both failures come from the same place: the question "which rooms can I let?" has no answer until a date is named, and the form asks it in the wrong order.

## What Changes

- The date the tenant moves in is asked **first**, before the room.
- The rooms offered are the ones that can actually take a tenancy **beginning that day**: free then, not merely free now.
- Changing the date re-asks the question. A room chosen under an earlier date and no longer valid under the new one is dropped rather than carried silently into a submission the API will refuse.
- The room list stays empty, and says why, until a date is chosen.
- The API answers the question directly: a room listing can be asked which rooms are available on a given date, rather than the browser fetching every vacant room and guessing.

## Capabilities

### Modified Capabilities

- `room`: the room listing can be filtered to rooms available on a named date.
- `web-leases`: the signing form asks for the date first and offers only rooms that can take that date.

## Impact

- `backend`: the room list query schema and its `where`. No schema change, no migration.
- `frontend`: `LeaseFormDialog` field order and the room query.
- The existing `vacant=true` filter stays as it is; it answers a different question ("free right now") that the rooms screen still asks.
- New Vietnamese strings, reported for review rather than chosen silently.
