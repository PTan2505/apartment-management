## Why

A building's address is typed by hand into four fields — street, ward, city, country. That is how two spellings of one place get into the database, and once they are in, nothing groups them: the location filter offers `Ho Chi Minh` and `Hồ Chí Minh` as separate choices because they are separate values.

`api-building-locations` addressed the symptom, letting a client offer the values already stored rather than asking anyone to type them again. This addresses the cause: if an address is chosen from a source rather than typed, the variation never enters.

The key is already configured and unused. This is what reads it.

## What Changes

- Add two endpoints that let a caller search for a Vietnamese address and resolve the chosen one into the fields a building records.
- The provider's key stays on the server. It is never sent to a browser, and the API is the only thing that talks to the provider.
- Responses are **normalized to this system's own shape** — street line, ward, city, country — not passed through. A caller never sees the provider's field names, its administrative tiers, or its quirks.
- Administrative prefixes are removed. The provider returns `phường Thủ Đức` and `thành phố Hồ Chí Minh`; buildings record `Thủ Đức` and `Hồ Chí Minh`. Storing the prefixed form would recreate the very duplication this exists to prevent.
- A building may record the identifier of the place its address came from, so an address resolved today can be resolved again later. It is optional and absent for a hand-typed address.
- Address lookup is optional infrastructure: when no key is configured the two endpoints say so plainly and everything else runs normally.

### Why normalize rather than pass through

The provider models Vietnam with a district tier that the 2025 administrative reform abolished, and offers a flag that returns post-merger data instead. Verified directly: with that flag the district comes back empty and the ward is the merged one; without it, the old district and pre-merger ward are returned.

Getting that flag wrong is silent — the response looks fine and describes units that no longer exist. Holding it in one place on the server, rather than in every client that ever calls out, is the difference between deciding it once and rediscovering it.

The same argument covers the prefixes, the two-call search-then-resolve sequence, and the provider's own inconsistencies. One observed while verifying: a place whose label read `tỉnh Đồng Nai` reported its region as `thành phố Đồng Nai` — province and city are not interchangeable, and a client should not have to know that.

## Capabilities

### New Capabilities
- `address-lookup`: searching for a Vietnamese address and resolving one into the parts this system records, without the caller knowing which provider answers or how its data is shaped.

### Modified Capabilities
- `building`: "Owner can create a building" and "Owner can update a building" — a building may record the identifier of the place its address was resolved from.

## Impact

- **Code**: a new `backend/src/modules/addresses/` module; the buildings module accepts and returns one more optional field; `config/env.ts` already declares the key.
- **Database**: one nullable column on `Building`, with a migration. No backfill — the existing building was typed by hand and has no place to point at.
- **API surface**: two new endpoints under an addresses resource.
- **Behavioral change**: none to existing endpoints. The new building field is optional, so nothing that creates buildings today stops working.
- **External dependency**: the first outbound call this system makes. Its failure modes are handled rather than propagated.
- **Dependencies**: none. This blocks `web-address-autocomplete`, which puts it in the building form.
- **Out of scope**: no address lookup for anything but buildings. No caching, no re-resolution of existing addresses, and no geocoding, coordinates, or map display — the provider offers them and nothing here needs them.
