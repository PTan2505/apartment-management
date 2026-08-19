## Context

`web-buildings` built one list screen and deliberately extracted only three things whose shape does not depend on the domain — `useListParams`, `Pagination`, `EmptyState` — declining a general list abstraction on the grounds that one example cannot show what varies.

This is the second screen, so that judgement is now testable rather than asserted. The API side is complete: rooms report their building, filter by `buildingId`, search by code, and refuse four different things.

See proposal.md for motivation, including the formatter measurement.

## Goals / Non-Goals

**Goals:**
- Settle what actually repeats between two list screens, and extract only that.
- Build the room list once and use it in both places it belongs.

**Non-Goals:**
- Still no generic list abstraction. Two examples is better than one, but see below — the parts that differ are the interesting ones.
- No leases, invoices, or expenses on the building view. Each is its own change, and adding them now would build a dashboard before the screens it summarises exist.

## Decisions

### What two screens show actually repeats

The bet from `web-buildings` pays off unevenly, which is the useful part:

```
  repeated, and already extracted
    useListParams        page/filters ↔ URL, page reset      ✓ reused as-is
    Pagination           bound to the shared meta            ✓ reused as-is
    EmptyState           nothing-yet vs nothing-matches      ✓ reused as-is

  repeated, extract now
    SearchField          debounced, replace-history          ← new
    row actions menu     edit / retire / restore             ← shape identical

  looked repeatable, is not
    the table            different columns, different cells
    the card             different fields, different emphasis
    the form dialog      buildings: one form; rooms: two
    the filters          dropdown-only vs dropdown + search
```

Had a `<ResponsiveList>` been built against buildings, rooms would have had to fight it on three of the four. Building the table and cards concretely a second time costs less than the abstraction would have.

### The formatters collapse rather than being renamed

Measured across every value this system stores, the two formatters differ only where the amount formatter rounds a fractional value — and every such case is wrong. `baseRent` at two decimal places is neither an amount nor a rate under that split, which is what exposed it.

One function, showing decimals when the value carries them, is correct for invoice totals (whole, unchanged), rents (two places), rates (four places), and quantities alike. `formatRate` disappears and its behaviour becomes `formatMoney`'s.

This does not change `web-infrastructure`'s requirement — it already says formatting must preserve the precision the value carries. The two functions were an implementation that satisfied it clumsily.

### Search: two separate problems, two separate fixes

```
  type "A-101"  →  A · A- · A-1 · A-10 · A-101

  without debounce   5 requests, the first four discarded
  without replace    5 history entries; Back removes one character
```

Debouncing is about the network; history replacement is about the browser. Fixing one leaves the other, and they are easy to conflate because both are "typing produces too many things".

`useListParams` gains a per-filter notion of whether a change replaces or pushes. A dropdown pushes — Back should undo choosing a city. A search field replaces — Back should leave the search entirely, not edit it.

Alternative considered: keeping search out of the URL. Rejected because a filtered view stops being shareable the moment the interesting part is the search term.

### One room list, two contexts

```
  /rooms                          /buildings/:id
  ┌────────┬──────┬──────┬────┐   ┌──────┬──────┬────┐
  │Building│ Code │ Rent │ ⋮  │   │ Code │ Rent │ ⋮  │
  └────────┴──────┴──────┴────┘   └──────┴──────┴────┘
   building column + filter        context establishes it
```

The same component, with the building column and the building filter suppressed when a building is already established. A prop, not a variant hierarchy — the rows, the cards, the actions, and the dialogs are identical.

This is why the two screens are one change. Split apart, the room list would have been written knowing only one of its two homes, and the second change would have reworked it.

### Create and edit are different forms

`updateRoomSchema` accepts only `roomCode` and `baseRent`. A room cannot move between buildings, so:

```
  create                     edit
  building  [select ▾]       building  Sunrise      (shown, not editable)
  code      [______]         code      [______]
  rent      [______]         rent      [______]
```

Buildings got away with one dialog for both because every field was editable. Pretending the same here would offer a control that cannot work, so the difference is explicit in the spec rather than left as an implementation detail.

Only buildings in service are offered when creating, because the API answers `400` for a retired one. Not offering an invalid choice is better than explaining the rejection afterwards.

### Four refusals, three of them conflicts

```
  create  duplicate code in the same building          409
  create  building is retired                          400  ← avoided by not offering
  retire  room has an active lease                     409
  restore code taken by another room since retirement  409
```

The last is the one worth designing for rather than discovering: retire `A-101`, create a new `A-101`, then try to restore the old one. The owner did nothing wrong and the refusal is not obvious, so the API's own message is shown rather than a generic failure.

Room code uniqueness is never judged by the form. It holds only among rooms in service in one building, and a retired room's code is reusable — the client cannot know without asking, and guessing would reject codes the API would have accepted.

### The building view is part of this change, not of `web-buildings`

`web-buildings` deferred a detail page on the grounds that it would only repeat what the row already shows. That is still true of the building's own fields; what makes the page worth having is the rooms. So the page arrives with them, and `web-buildings` gains only the affordance that opens it.

## Risks / Trade-offs

- [Two screens in one change makes it the largest frontend change so far] → accepted, because they share the room list, its hooks, and its dialogs; splitting would build those against one context and rework them for the other.
- [Collapsing the formatters touches `web-buildings`, which is already archived] → the change is a strict improvement and its call sites are few; the alternative is leaving a known-wrong rounding in place because the screen using it shipped.
- [Suppressing the building column by prop could drift into a component that serves neither context well] → contained while there are two contexts differing in one dimension; a third would be the moment to reconsider.
- [Searching still relies on the API's case-insensitive matching, which folds only ASCII] → room codes are ASCII in practice, so this is latent rather than live; the underlying collation is recorded in `api-building-locations` and remains unfixed by choice.
- [The building view will attract leases, invoices, and expenses before those screens exist] → explicitly out of scope, so the pressure is visible rather than absorbed one field at a time.

## Migration Plan

Nothing is deployed. The rooms route swaps from placeholder to real screen, and the building view is new. `formatRate` is removed in the same change as its call sites, so there is no intermediate state. Rollback is reverting the change.
