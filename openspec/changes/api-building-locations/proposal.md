## Why

Building listing can already be filtered by ward and city, but nothing tells a caller which wards and cities actually exist. A client wanting to offer those filters has no choice but to make the user type — and typing is where this goes wrong.

The filters match partially and ignore case, which sounds forgiving until the values are Vietnamese. The database was created with `C` collation, so Postgres folds case for ASCII only: searching `đức` does not find `Thủ Đức`, because folding `Đ` to `đ` is beyond what `C` does. A user typing the ward they are looking for, in lower case, gets nothing.

Offering the values the caller can choose from removes that problem rather than working around it. A value taken from the database matches itself exactly, with no folding involved. It also makes inconsistent data visible instead of hiding it: if one building was entered as `Ho Chi Minh` and another as `Hồ Chí Minh`, both appear as separate options and the mistake can be seen and corrected — where a free-text search silently returned half the buildings.

## What Changes

- Add an endpoint returning the wards and cities that buildings actually record, grouped so that each city carries its own wards.
- The result honours the same active/retired distinction as building listing: the locations of retired buildings appear only when retired buildings are being included.
- Values are ordered for Vietnamese rather than by byte value. Under `C` collation `Đà Nẵng` sorts after `Hồ Chí Minh`, which is wrong in any Vietnamese list.
- The endpoint is deliberately **not** paginated. It is a small bounded summary, like the revenue report, not a listing.

### What this does not do

It does not fix the underlying case-folding defect. Free-text search elsewhere — room codes today, anything added later — still folds ASCII only. This change makes the building filters work without depending on folding at all; repairing the collation is a separate decision with a wider blast radius.

Nor does it group different spellings of the same place. `Ho Chi Minh` and `Hồ Chí Minh` remain two options, because they are two different values. Making them one is the reference-data upgrade path already recorded in `api-building-address`, and still not worth building.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `building`: adds a requirement covering retrieval of the ward and city values currently in use, so a caller can offer them as choices rather than asking for free text.

## Impact

- **Code**: `backend/src/modules/buildings/` — `router.ts`, `controller.ts`, `service.ts`, `schema.ts`. No other module.
- **Database**: none. No schema change, no migration, no new index — the query reads columns that already exist.
- **API surface**: one new endpoint under the buildings resource.
- **Behavioral change**: none to existing endpoints. Building listing and its filters are untouched.
- **Dependencies**: none. Together with `api-address-lookup` this unblocks `web-buildings`, and the two backend changes are independent of each other.
- **Out of scope**: no change to how the ward and city filters match, no reference data or normalisation of location names, no collation repair, and no locations for rooms, leases, or any other resource.
