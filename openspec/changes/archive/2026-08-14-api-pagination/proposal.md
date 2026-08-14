## Why

Every list endpoint currently returns every matching row. That is fine today with a handful of buildings, but rooms, customers, invoices, and especially leases accumulate without bound — a building let for a few years produces a lease per room per tenancy, and none of it is ever deleted because retirement is a soft flag. Adding pagination now, while no frontend consumes these endpoints, costs nothing; adding it later means changing every caller.

## What Changes

- Define a single paginated response contract shared by every list endpoint: a `data` array plus a `meta` object carrying the current page, page size, total item count, and total page count.
- **BREAKING**: list endpoints now return that object instead of a bare array. Affects `GET /buildings`, `GET /rooms`, `GET /customers`, `GET /leases`, and `GET /leases/:id/occupants`. No frontend exists yet, so nothing downstream breaks in practice.
- Accept `page` and `pageSize` query parameters on those endpoints, with sensible defaults so existing calls keep working without modification, and an upper bound on `pageSize` so a caller cannot request the entire table in one response.
- Pagination is offset-based rather than cursor-based. The data volumes here are hundreds of rows, and offset paging supports jumping to an arbitrary page, which a management UI needs and cursors cannot provide.
- Existing filters are unaffected and combine with paging: the total in `meta` reflects the filtered set, not the whole table.
- Occupant lists are paginated too, for consistency, even though a lease rarely has enough occupants to fill a page.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `api-infrastructure`: adds the shared paginated response contract — envelope shape, parameters, defaults, and bounds.
- `building`: "Owner can list and retrieve buildings" — listing is paginated.
- `room`: "Owner can list and retrieve rooms" — listing is paginated.
- `customer`: "Owner can list and retrieve customers" — listing is paginated.
- `lease`: "Owner can list, filter, and retrieve leases" and "Owner can manage the occupants of a lease" — both listings are paginated.

## Impact

- **Code**: a shared pagination helper in `backend/src/lib/`; query schemas and services for buildings, rooms, customers, and leases; the controllers that shape those five responses.
- **Database**: none. No schema change and no migration — paging uses `skip`/`take` and a count query.
- **API surface**: five list endpoints change response shape and gain two optional query parameters. Single-item endpoints, creates, updates, and all state-changing routes are untouched.
- **Performance**: each list request now issues a count query alongside the page query. At this scale that is negligible, and it is what makes `meta.total` possible.
- **Dependencies**: none.
- **Out of scope**: no cursor-based paging, no sorting parameters, and no change to how filters behave.
