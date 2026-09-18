## Why

Whether a building or room is in service is a three-way question — everything, only
what is running, only what has been stopped — and the screens offer a two-way switch:
either hide what is stopped, or mix it in. "Show me only what I have taken out of
service" cannot be asked at all, which is exactly the question behind tidying up.

The switch also hides by default, so a room that was retired is simply absent until
someone thinks to look for it.

## What Changes

- The buildings and rooms list endpoints take a status filter with three values —
  in service, out of service, or both — replacing the include-inactive flag.
- Both screens replace the switch with a status dropdown. Its default is "Tất cả", so
  nothing is hidden unless the owner narrows it.
- Callers that ask for everything say so through the same filter.

## Capabilities

### Modified Capabilities

- `building`: the list and the locations endpoint filter by in-service status, three ways
- `room`: the list filters by in-service status, three ways
- `web-buildings`: a status dropdown defaulting to everything, in place of the switch
- `web-rooms`: the same dropdown on the rooms screen

## Impact

- `backend/src/modules/buildings/{schema,service}.ts`, `backend/src/modules/rooms/{schema,service}.ts`
- `frontend` buildings and rooms filters, their API params, and the callers that asked for everything
- Service fees keep their own include-inactive flag; this change does not touch them
