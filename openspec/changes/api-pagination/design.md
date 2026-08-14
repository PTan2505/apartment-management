## Context

Five list endpoints across four modules currently return bare arrays of every matching row. Each module owns its own query schema and service, and controllers map service output straight to JSON. There is no shared response-shaping layer — the only cross-cutting response contract today is the error shape produced by the centralized error handler. See proposal.md for motivation.

Decisions locked before this design (from prior discussion, not reopened here): an envelope of `{ data, meta }` rather than count headers; offset-based paging rather than cursors; all five list endpoints including the nested occupant list.

## Goals / Non-Goals

**Goals:**
- One pagination contract defined once and applied identically by every list endpoint, rather than four near-identical implementations.
- Bounded responses: no request can return an unbounded number of rows.
- Totals that describe the filtered set, so a UI can render "page 2 of 7" for a search.

**Non-Goals:**
- No cursor-based paging. Offset paging is a poor fit for very large or rapidly-changing datasets, but supports arbitrary page jumps, which a management UI needs.
- No sorting parameters. Existing endpoints sort by creation order and this change does not alter that; adding sort control is a separate concern.
- No paging on single-item endpoints, creates, updates, or state transitions.

## Decisions

**A shared helper rather than per-module implementations**: `backend/src/lib/pagination.ts` provides the query schema fragment, the `skip`/`take` computation, and the function that wraps rows plus a total into the response envelope. Each module composes the schema fragment into its own query schema and calls the wrapper. Alternative considered: duplicating the logic in each module — rejected because five copies of an off-by-one-prone offset calculation is exactly the kind of duplication the earlier centralized error handler exists to avoid, and inconsistent defaults across endpoints would be invisible until someone hit them.

**Rejecting out-of-range page sizes rather than clamping**: a `pageSize` above the maximum returns 400. Silently clamping to the maximum would mean a caller asking for 1000 rows gets 100 and has no way to know the response was truncated beyond noticing the meta — which is how pagination bugs become data-loss bugs in reporting. Zero, negative, and non-numeric values are likewise rejected by the query schema, consistent with how every other invalid query parameter is handled.

**A page past the end returns 200 with an empty `data`, not 404**: the request is well-formed and the collection exists; there simply are no rows in that range. `meta` still reports the true totals, so a client that over-shot can correct itself without a second request. This also keeps the endpoint's failure modes unchanged — a 404 from a list endpoint would be a new and confusing signal.

**Count query runs alongside the page query**: `meta.total` requires counting the filtered set, which is a second query per request. It runs inside `prisma.$transaction([...])` so the count and the page are read consistently — otherwise a concurrent insert between the two queries could produce a total that disagrees with the page contents. At this scale the cost is negligible, and the consistency matters more than saving one round trip.

**Occupant lists are paginated despite being small**: a lease will rarely have enough occupants to fill a page. Paginating anyway means every list response in the API has the same shape, so a client never has to remember which endpoints are special. The alternative — leaving one endpoint returning a bare array — is the kind of inconsistency that costs more in confusion than it saves in code.

**Defaults chosen to keep existing calls working**: omitting both parameters yields page 1 at the default page size, so every current caller continues to function; only the response shape changes. Concretely: **default page size 20, maximum 200**.

A default of 20 means a building with more than twenty rooms has its room list split across pages, which is the common view. That is a deliberate trade: a smaller default keeps every response light and makes clients exercise paging from day one, rather than working by accident until a building grows past the default and quietly starts truncating. Callers that genuinely want a whole list can raise `pageSize` up to the maximum.

## Risks / Trade-offs

- [Changing five response shapes at once is a breaking API change] → deliberate and cheapest now: no frontend consumes these endpoints yet, and the specs pin the new shape so it is explicit rather than discovered.
- [Offset paging can skip or repeat rows when items are inserted while a client pages through] → accepted; the data here changes on human timescales, not continuously, and the alternative (cursors) cannot support the page jumping a management UI needs.
- [Two queries per list request instead of one] → mitigated by running them in a single transaction, which also removes the inconsistency risk; negligible at hundreds of rows.
- [A caller that ignores `meta` sees only the first page and may believe it has everything] → unavoidable with any pagination scheme; mitigated by the envelope making the truncation obvious, which is precisely why the shape was chosen over a bare array plus a header that is easy to miss.

## Migration Plan

No database change and no migration. Deploy is a straight code release; existing callers keep working at the parameter level and only need updating to read `data` instead of the top-level array. Rollback is reverting the release — nothing persists in the new shape, so there is no data to undo.
