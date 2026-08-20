## Why

Customer search cannot find Vietnamese names the way Vietnamese users type them.

The database uses the `C` collation, which folds letter case for ASCII only. Two consequences, verified against the running database:

- Case matching breaks on Vietnamese letters. With `Nguyễn Văn A` stored, searching `NGUYỄN` returns nothing while `nguyễn` returns the record — the search is case-insensitive for `abc` and case-sensitive for `ăâđ`.
- Diacritics must be typed exactly. Searching `nguyen van a` returns nothing, and typing without diacritics is how names are normally entered.

The second is the one that matters in practice. A search that demands perfectly-typed diacritics fails on the most common way a person actually searches.

Fixing the collation itself was considered and rejected as disproportionate: it changes how the database compares text everywhere, which drags in room-code uniqueness and the building-locations endpoint for a problem that is confined to searching. This change keeps the fix where the problem is.

## What Changes

- Add a `fullNameSearch` column to `User`, holding a normalised form of `fullName`: lowercased and with diacritics removed, so `Nguyễn Văn A` is stored as `nguyen van a`.
- Maintain it wherever `fullName` is written — customer registration, customer update, and the owner seed script — so it can never drift from the name it describes.
- Backfill it for existing rows in the migration.
- Search it instead of `fullName`, normalising the incoming query the same way. Searching `nguyen`, `NGUYEN`, or `Nguyễn` all find `Nguyễn Văn A`.
- Phone search is unchanged and stays exact — digits have neither case nor diacritics.

Not included, deliberately: `Room.roomCode`, `Building.ward`, and `Building.city` keep their current search. Room codes are effectively ASCII (`A-101`), where the existing case-insensitive match already works; ward and city come from the address provider in a consistent spelling. Adding normalised columns there would be surface with no behaviour behind it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `customer`: customer search is specified for the first time — the capability currently has a scenario referring to searching without any requirement defining what a search matches — and specified as case- and diacritic-insensitive on the name, exact on the phone number.

## Impact

**Database.** One added column plus a backfill. No index changes, no constraint changes, no rebuild — the column is new, so nothing existing is altered.

**Code.** A shared `normalizeVi` helper; three write paths set the column; one read path searches it.

**Correctness note.** The normalisation must map `đ → d` explicitly. Unicode NFD decomposition does not separate `đ` into `d` plus a mark — it is its own letter — so stripping combining marks alone leaves `đức` as `đuc`, and a search for `duc` would miss it. This was verified rather than assumed.

**Behaviour.** Strictly widening: every search that returns a customer today still returns them. No search that succeeds now begins to fail.

**Downstream.** Unblocks `web-customers`, whose search screen this feeds.
