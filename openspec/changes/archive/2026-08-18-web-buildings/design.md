## Context

`web-foundation` and `web-auth` left a shell with an authenticated `apiClient`, React Query defaults that never retry a 4xx, and `ApiError` carrying `isConflict`, `isValidation`, and `fieldErrors`. Nothing has used any of those against real data yet.

The API side is complete: listing with `ward`, `city`, `includeInactive`, `page`, `pageSize`; `GET /buildings/locations` returning cities each carrying their wards; create, update, retire, restore. Retire answers `409` when a room still has an active lease. Money arrives as numbers.

See proposal.md for motivation, including the `formatMoney` defect.

## Goals / Non-Goals

**Goals:**
- Establish list-screen mechanics that the next six screens can copy without rediscovering them.
- Use `ApiError`'s existing distinctions rather than inspecting statuses at the call site — this is the change that proves they were worth building.

**Non-Goals:**
- No generic list abstraction. See the decision below; this is the main design judgement in the change.
- No building detail page. Its purpose is to host rooms, which arrive with `web-rooms`.
- No optimistic updates. Invalidation after a mutation is enough at this scale and cannot show a state the server rejected.

## Decisions

### Build one concrete screen, extract three primitives

Knowing six more list screens are coming is an argument for extracting the right things, not for extracting early. The first instance has not seen enough variation to know what varies: rooms filter by building, invoices by lease and payment state, expenses by category and date range, and the revenue report is not a list at all. A `<ResponsiveList>` designed against buildings alone would be shaped by one example and fought by the next.

Three pieces are exceptions, because their shape does not depend on the domain at all:

```
  useListParams()    filters + page ↔ URL, resetting page when a filter changes
  <Pagination>       bound to the shared { page, pageSize, total, totalPages }
  <EmptyState>       "nothing yet" vs "nothing matches", with the fitting action
```

Everything else — columns, card layout, which filters exist — stays in `features/buildings/`. When `web-rooms` builds the second one, what actually repeats will be visible and can be lifted then.

### Filters and page live in the URL

```
  /buildings?city=Hồ+Chí+Minh&ward=Thủ+Đức&page=2&includeInactive=true
```

This makes the view shareable, survives a reload, and makes the browser's back control undo the last filter change rather than leave the screen — which is the most common complaint about admin lists. `useSearchParams` already exists in the router.

The cost is that arbitrary combinations can arrive from outside. A `city`/`ward` pair that never co-occur is not an error: the API returns 200 with an empty list, and the screen shows its "nothing matches" state. Nothing needs to validate the pair; it just needs to not look broken.

Alternative considered: component state. Simpler, and rejected only because reload and Back are the two things a filter panel is most often judged on.

### Resetting to page 1 on a filter change is a correctness fix, not a nicety

Your pagination contract rejects invalid page values with a 400 rather than clamping — deliberately, so a truncated response cannot masquerade as a complete one. But an out-of-*range* page is not invalid:

```
  page=3, filters narrow the results to one page
  → 200, data: [], meta: { total: 1, totalPages: 1 }
```

The screen would show nothing while reporting that one result exists. `useListParams` therefore owns the reset, so no screen can forget it — which is precisely why it is a shared primitive rather than something each screen wires up.

### Two filters, one request

`GET /buildings/locations` returns cities each carrying their wards, so narrowing wards to the selected city needs no further request. The selected city indexes into the response.

Changing the city discards a ward that does not exist under the new one. Left in place it produces a pair matching nothing, which reads as a broken screen rather than an empty result.

The endpoint takes `includeInactive` and the screen passes the same value it passes to the listing. If they disagreed, a location could be offered whose only buildings are filtered out — a choice that guarantees an empty result.

### `formatRate` beside `formatMoney`, not a parameter on it

```
  formatMoney(3000000)   →  3.000.000 ₫     amounts: Decimal(14,0), whole
  formatRate(3500.5)     →  3.500,5 ₫       rates:   Decimal(12,4), fractional
```

The alternative was an optional `decimals` argument. Rejected because the default would stay lossy: a future call site that forgets the argument silently rounds a rate, which is the exact bug being fixed. Two names make the wrong choice explicit rather than available by omission.

`formatRate` shows a fraction only when one exists, so a whole rate does not acquire a misleading `,0`.

### Dialogs for the form, full-screen below `md`

MUI's `Dialog` with `fullScreen` under the breakpoint keeps the list context on desktop and behaves like a native sheet on a phone. The form is seven fields, which fits comfortably.

This is not asserted as right for every screen. The lease form — room picker, customer picker, dates, occupant count, meter reading, plus an occupants panel — will likely want its own route, and can take one without disturbing the screens that came before. Choosing routes here for consistency with a form that does not exist yet would be speculative.

The trade accepted: the form is not addressable, so `/buildings/new` cannot be linked or verified by URL.

### Validation mirrors the API exactly

The create schema is `min(1)` on name, address, ward, and city, and non-negative on both rates, with country defaulted. The client schema matches, field for field.

The temptation is to add rules the API lacks — a rate ceiling, an address pattern. Any such rule rejects input the API would have accepted, and the failure is invisible from the backend. The API owns correctness; the form only avoids a pointless round trip.

Field-level rejections are attributed using `ApiError.fieldErrors`, which already carries zod's flattened shape from the backend. Nothing needs to parse a response body at the call site.

### The 409 is an outcome, not an error

Retiring a building with an occupied room is a reasonable thing to attempt and a reasonable thing to refuse. `ApiError.isConflict` distinguishes it, and the API's own message — naming the active lease — is more useful than anything the screen could invent.

This is the first real use of those getters. If it required inspecting `error.status === 409` at the call site, the abstraction would have failed its first test.

## Risks / Trade-offs

- [Declining to build a shared list abstraction means some duplication when `web-rooms` lands] → intended. Duplication that is visible is cheaper to resolve than an abstraction shaped by a single example; the three primitives that genuinely do not vary are extracted up front.
- [Filters in the URL admit combinations that match nothing] → not an error condition: the API answers 200 with an empty list and the screen shows its "nothing matches" state.
- [The form is not addressable, so it cannot be linked or opened directly] → accepted for a seven-field form; the lease form can choose a route later without changing this one.
- [`formatRate` and `formatMoney` can still be confused at a call site] → reduced, not eliminated: both are named for what they format, and neither silently rounds by default.
- [Retiring is confirmed but not undoable in one step] → restore exists and needs no confirmation, so the round trip is short; nothing is destroyed.

## Migration Plan

Nothing is deployed and no client depends on the placeholder. The route swaps from the placeholder to the real screen in one step; there is no intermediate state to support and rollback is reverting the change.
