## Why

Rooms are where the money is. A lease is signed on a room, an invoice is raised against a room's rent and meter, an expense is attributed to a room. Nothing downstream can be built until rooms can be managed, and the screen has been a placeholder since the shell was built.

It is also the first screen to be built *second*. `web-buildings` deliberately declined to invent a shared list abstraction, on the grounds that one example is not enough to know what varies. This change is where that bet is settled: what genuinely repeats becomes visible, and what looked general turns out not to be.

## What Changes

- Replace the rooms placeholder with a working screen: the rooms the owner manages, each with the building it belongs to, its code, its rent, and whether it is in service.
- Narrow by building, chosen from the buildings that exist; search by room code as free text; include retired rooms on request; page through the results.
- Create and edit rooms. A room's building is chosen when it is created and cannot be changed afterwards, so the two forms differ.
- Retire a room behind a confirmation, and restore a retired one. Three separate refusals are possible and each is reported in the API's own words.
- Add a page for a single building, showing the building and the rooms in it, reached from the buildings list.

### Correcting a mistake in `web-buildings`

That change split money formatting in two — one function for amounts, one for rates — on the theory that amounts are whole and rates fractional. Measuring the two against every value this system stores shows they are **identical except where the amount formatter rounds**, and every one of those cases is wrong:

```
  3.000.000      →  3.000.000 ₫   3.000.000 ₫     same
  25.000         →  25.000 ₫      25.000 ₫        same
  3500,5         →  3.501 ₫       3.500,5 ₫       one of these is wrong
  3.000.000,5    →  3.000.001 ₫   3.000.000,5 ₫   one of these is wrong
```

Rent proves it: `baseRent` is stored to two decimal places, so it is neither an amount nor a rate under that split. The distinction does not exist. The two functions collapse into one that shows decimals when the value has them, which is correct for totals, rents, rates, and quantities alike.

### What rooms need that buildings did not

- **A search field.** Buildings filtered by dropdown; rooms search room codes by typing. Typing must not issue a request per keystroke, and must not push a history entry per keystroke — otherwise the browser's back control walks backwards through the search term one character at a time.
- **A list that works in two places.** The same rooms appear on their own screen and inside a building's page. On the rooms screen each row names its building; inside a building that column is noise.
- **Forms that differ.** A room's building is fixed at creation, so the create form chooses one and the edit form only shows it. Only buildings still in service can be chosen, because the API refuses to add a room to a retired building.

## Capabilities

### New Capabilities
- `web-rooms`: managing rooms from the browser — finding them by building and code, creating and editing them, taking them in and out of service, and seeing the rooms that belong to a particular building.

### Modified Capabilities
- `web-buildings`: "The owner can see the buildings they manage" — a building can now be opened to see it on its own, which is what makes its rooms reachable.

## Impact

- **Code**: new `frontend/src/features/rooms/`; a building detail page under `features/buildings/`; the buildings list gains a link; `lib/format.ts` loses a function; `lib/useListParams.ts` learns which filters replace history rather than pushing it; a shared debounced search field.
- **Backend**: none. Rooms already report their building, and every endpoint this needs is merged.
- **Dependencies**: no new packages.
- **Behavioral change**: the rooms destination stops being a placeholder, and building names in the buildings list become links. Money display becomes correct for fractional values everywhere, which affects the buildings screen too.
- **Dependencies on other work**: requires `web-buildings` and `api-room-building`, both merged. Blocks `web-leases`, which needs a room to lease.
- **Out of scope**: no leases, invoices, or expenses on the building page — each belongs to its own change, and the page would otherwise become a dashboard before those screens exist. No moving a room between buildings, which the API does not support. No deleting rooms, which the API deliberately does not support.
