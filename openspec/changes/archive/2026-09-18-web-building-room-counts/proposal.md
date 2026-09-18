## Why

The buildings table answers "where" and "what do utilities cost here" and stops. The
question an owner actually opens it with — how full is this place, and how many rooms
are earning nothing right now — can only be answered by leaving the screen, filtering
the rooms list by building, and counting.

Opening a building is also awkward: only its name is clickable, a link a few characters
wide in a row that is otherwise dead to the pointer.

## What Changes

- A building carries how many of its rooms are let and how many stand empty, counted by
  the API from the same rule the rooms screen uses, and the buildings table shows both.
- The whole row opens the building. The name stops being a link and the row takes the
  click, with the keyboard and middle-click behaviour a row-as-link needs.

## Capabilities

### Modified Capabilities

- `building`: the list response carries each building's let and vacant room counts
- `web-buildings`: the table shows those counts, and the row itself opens the building

## Impact

- `backend/src/modules/buildings/service.ts` — counts alongside the paginated page
- `frontend/src/features/buildings/BuildingList.tsx` — two columns, row click
- The rooms screen is unchanged; it already answers this per room
