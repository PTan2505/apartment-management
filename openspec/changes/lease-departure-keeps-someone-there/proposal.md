## Why

Two holes in recording that somebody moved out of a shared room.

**The last occupant can leave and the tenancy stays open.** Departing the only current occupant is accepted by the API and offered by the screen, which produces a running tenancy with nobody living in it — still billed, still holding a deposit, still occupying the room. That is not a state the owner meant to create; it is the state they get when the action they wanted was "end this tenancy" and the button in front of them said "ghi nhận rời đi".

**Handing over responsibility is two requests that can half-succeed.** When the person leaving is the one named on the agreement, the screen transfers responsibility and then records the departure — two calls. If the second fails, the tenancy is left with a new signatory and the old one still living there: a state nobody asked for, arrived at silently, and only visible to someone who reads the occupant list carefully.

## What Changes

- Departing the ONLY current occupant is refused, and the refusal says what to do instead: record the tenancy's move-out, which is the operation that actually ends it.
- The screen stops offering the action there at all, rather than offering it and reporting a refusal.
- Departure accepts the successor in the same request: where the departing person is the one responsible, the owner names who takes over and both facts are written together or not at all.
- The screen keeps asking the way it asks today — the list of everyone else, to pick from — but sends one request instead of two.

## Capabilities

### Modified Capabilities

- `lease`: a lease cannot be left with occupants recorded and nobody living there; handing over responsibility while departing is one atomic operation.
- `web-leases`: the departure action is withheld from the only occupant, and the transfer it requires is sent with it.

## Impact

- `backend/src/modules/leases/{service,schema,controller}.ts`, one new error code.
- `frontend`: `OccupantsCard`, `DepartOccupantDialog`.
- No schema change and no migration.
- **Breaking for API callers:** departing the last occupant now returns 409. The only caller is this frontend.
