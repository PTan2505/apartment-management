## 1. Rooms can be asked about occupancy

- [x] 1.1 `occupancy: all | let | vacant` on the listing, applied in the query
- [x] 1.2 In the same `AND` as the scope and building filters, not a second `leases` key

## 2. The rooms list

- [x] 2.1 Status says let or free; the in-service mark is gone
- [x] 2.2 A stopped room is muted AND labelled, and is not called free
- [x] 2.3 A filter by occupancy, agreeing with the rows and with the API
- [x] 2.4 Retiring offered only on a free room
- [x] 2.5 The actions column absent for any role but the owner, on table and cards

## 3. Filters over what the owner entered

- [x] 3.1 One `PickerField`, matching by value, clearable only where clearing means something
- [x] 3.2 Eleven filters converted: buildings, rooms, wards, cities
- [x] 3.3 Closed lists left as plain dropdowns
- [x] 3.4 A room option carries its building where the building is not already fixed

## 4. Prefilled readings

- [x] 4.1 Move-out and renewal prefill the reading already invoiced
- [x] 4.2 The floor is still refused, with the figure named

## 5. Strings

- [x] 5.1 New Vietnamese strings reported for review

## 6. Checks

- [x] 6.1 `tsc --noEmit`, `codes:check`, `atomic:check`, frontend lint and build
- [x] 6.2 In a visible browser: the two occupancy filters partition the list, and the counts match the API
- [x] 6.3 A stopped room is muted, labelled, and not called free; a live one is not muted
- [x] 6.4 A filter typed into narrows, says when nothing matches, and filters for real once chosen
- [x] 6.5 As a MANAGER: no actions column, no actions button, everything still readable
- [x] 6.6 Both readings prefilled from the invoiced figure — 1440px and 390px
