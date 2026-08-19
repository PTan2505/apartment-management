## Why

A building's address is entered as four separate fields — street, ward, city, country. That is more typing than it should be, and it is how two spellings of one place get into the database: nothing stops one building recording `Hồ Chí Minh` and the next recording `Ho Chi Minh`, after which the location filter offers both as separate choices.

`api-address-lookup` built the means to fix that and nothing uses it. This is the half you can see: one field, a search, and the parts fill themselves.

## What Changes

- Replace the four address inputs with a single address search. Choosing a result fills the street line, ward, city, and country, and records which place they came from.
- Show what was filled. The resolved parts are displayed rather than hidden, because the owner is about to save them and the provider is not always right.
- Keep a way through by hand. A link reveals the four fields as ordinary inputs, for an address the provider does not know, a value it gets wrong, or a deployment with no lookup configured at all.
- Fall back automatically when lookup cannot work — an unconfigured server or an unreachable provider puts the form straight into manual entry with an explanation, rather than presenting a search that cannot answer.

### Why the parts are shown rather than hidden

The tempting version has one field and nothing else: search, choose, save. It reads better and it is a trap.

The API requires a ward and a city. If the only way to supply them is a resolved place, then a building cannot be created when the provider is down, when no key is configured, when the address is not in the provider's data, or when what it returns is wrong — and it is sometimes wrong. While verifying the backend, a place whose own label read `tỉnh Đồng Nai` reported its region as `thành phố Đồng Nai`; province and city are not the same thing.

The backend was deliberately built so that lookup being absent is a normal state and everything else keeps working. A form that cannot create a building without it would undo that decision from the other side.

So: one field by default, the result visible, and a way out that is always there.

### What the owner sees

```
  Find address   [ 12 Nguyễn Huệ                     ]
                 ├ 12 Đường Nguyễn Huệ, xã Bù Đăng, tỉnh Đồng Nai
                 └ …
                         │ choose
                         ▼
  Address        12 Đường Nguyễn Huệ
  Ward           Bù Đăng
  City           Đồng Nai
  Country        Việt Nam
                 Enter address manually
```

## Capabilities

### Modified Capabilities
- `web-buildings`: "The owner can create and edit a building" — the address is chosen by searching rather than typed field by field, with manual entry retained as a fallback.

### New Capabilities
(none)

## Impact

- **Code**: `features/buildings/BuildingFormDialog.tsx` gains the search and the two entry modes; a new `features/addresses/` holding the search and resolve calls; a debounced search input shared with the rooms screen.
- **Backend**: none. Both endpoints and the building's `placeId` are merged.
- **Dependencies**: no new packages.
- **Behavioral change**: creating a building no longer starts with four empty text boxes. Nothing else changes, and a building can still be created entirely by hand.
- **Dependencies on other work**: requires `api-address-lookup`, merged. Shares a debounced search field with `web-rooms`; whichever is built first introduces it.
- **Out of scope**: no address lookup anywhere but the building form. No re-resolving existing buildings in bulk, no map or coordinates, and no attempt to reconcile the spellings already recorded — this stops new ones appearing rather than repairing old ones.
