## Context

- `listBuildings` pages `building.findMany` with no relations. Rooms are never read.
- The rooms module already owns the rule: `HOLDS_ITS_ROOM = { moveOutDate: null, cancelledAt: null }`, exported from `leases/occupancy.ts`, turned into `isLet` by `toRoom`.
- A room out of service has `isActive: false`; the rooms list hides those unless asked.
- The buildings table renders one row per building, with the name as a `RouterLink` and an actions menu at the end.

## Goals / Non-Goals

**Goals.** The list answers "how full is this building" without leaving the screen. One rule for "let", read from where it already lives. The row behaves like the link it now is.

**Non-Goals.** Counts on the building detail page. A separate occupancy percentage. Counting anything about tenants, money, or rooms out of service.

## Decisions

### The counts come from the API, in two grouped queries

After the page of buildings is fetched, two `room.groupBy` queries over exactly those building ids: rooms in service, and rooms in service whose `leases` have `some: HOLDS_ITS_ROOM`. Empty is the difference.

Two queries rather than a filtered `_count` per building, because a relation `_count` with a `where` is a Prisma feature whose availability has moved between versions, and rather than a room read per building, which is one query per row on a page of twenty.

Deriving the counts in the frontend was rejected under the project's rule to fix a data shape at the source: it would fetch every room of every listed building, and it would copy the "let" rule into a second place — the exact duplication that let one person be recorded in three rooms.

### `roomsLet` and `roomsEmpty`, not a total

Two independent figures rather than "let of total": the empty count is the one that costs money, and making the reader subtract to find it buries it. The total is recoverable by addition when anything needs it.

### The row is a link, and is built as one

The name stops being a `RouterLink`; the `TableRow` gets `hover`, a pointer cursor, `tabIndex`, `role="link"`, Enter, and a click handler that navigates. Middle-click and modifier-click go through `window.open` with the same path, so "open in a new tab" keeps working — a row that silently loses that is worse than the link it replaced.

The actions cell stops propagation, so the menu and its dialogs do not navigate underneath themselves.

At phone width the card is already a whole clickable surface; only the table changes.
