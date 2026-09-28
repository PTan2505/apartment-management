## Why

Three complaints about the same thing: the screen knows something and makes the reader
work for it anyway.

- The rooms table marked every row "Đang hoạt động". A mark that applies to everything
  distinguishes nothing, and it sat where the useful answer belongs — is this room let?
  Meanwhile a room out of service was told apart only by a chip in that same crowded
  cell.
- Every filter over a list the owner has TYPED — buildings, rooms, wards, cities — was a
  plain Select. Those lists grow without limit; finding P402 among fifty-eight room codes
  is a scroll, not a choice.
- Two fields are left blank while the value they fall back to is printed right beside
  them, in a sentence, for the reader to retype.

## What Changes

- **The rooms table answers the question it is asked.** The status column shows let or
  free. A room out of service is greyed instead, and its row says "Đã ngưng" — it is
  free, but it cannot be let, and calling it "Còn trống" invites signing a tenancy the
  API will refuse.
- **A filter by let/free**, which the API could not express: `vacant` only ever narrows
  TO free rooms, and `vacant=false` means "do not narrow" rather than "only the let
  ones". Adds `occupancy: all | let | vacant`.
- **Retiring is offered only on a free room.** The API already refuses a let one; the
  menu no longer invites the refusal.
- **The actions column is the owner's.** For any other role it is gone entirely, rather
  than standing empty down the page.
- **Every filter over owner-entered data can be typed into** — one shared `PickerField`,
  used in eleven places. Closed lists (a tenancy's status, a payment method, per-room vs
  per-person) keep their Select: four fixed entries are read, not searched, and a text
  box in front of them invites typing something that is not an option.
- **Both meter fields are prefilled** with the reading already invoiced, instead of being
  left blank beside a sentence naming it.

## Capabilities

### Modified Capabilities

- `room`: rooms can be listed by whether a tenancy holds them.
- `web-rooms`: the list reports occupancy, greys what is out of service, offers retiring
  only on a free room, and hides the actions column from anyone but the owner.
- `web-infrastructure`: a filter over a list the owner has entered is typed into, not
  scrolled.
- `web-leases`: the closing and renewal readings are prefilled.

## Impact

- Affected specs: `room`, `web-rooms`, `web-infrastructure`, `web-leases`
- Affected code: `backend/src/modules/rooms/{schema,service}.ts`; a new
  `frontend/src/components/PickerField.tsx` and the eleven filters that now use it;
  `features/rooms/*`; `MoveOutDialog` and `RenewLeaseDialog`
- No schema change and no migration.
- **Reverses a deliberate decision**: the two meter readings were left blank on the
  grounds that a prefilled figure gets accepted without anybody walking out to the meter.
  The owner weighed that and chose consistency with every other field. The risk is a
  month billed at 0 kWh that no tenant will query.
