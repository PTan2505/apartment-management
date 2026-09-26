## Why

A building's page showed its two rates in one line of running text with an emoji in
front of each. That said what the numbers were, but not that they were SETTINGS — read
straight after the address, they looked like more address.

It has also fallen behind what a building actually holds. The default deposit months
added by `api-manager-limits` appeared nowhere, and the fee catalogue — configured per
building, and the source of every charge named beyond a term — could only be seen by
opening a move-out dialog.

And there was no way to change any of it from the page that shows it. The owner had to
go back to the list and find the row's menu.

## What Changes

- A "Cấu hình toà nhà" card on the building's page, carrying what the owner has set:
  the electricity rate, the water rate, the default deposit months, and the building's
  service-fee catalogue. Each figure says what it reaches — a rate applies to tenancies
  signed from then on, the deposit is what a new tenancy falls back to.
- The two emoji and the run-on line they sat in are gone.
- An edit button on that card, opening the form the list already uses. **Owner only**, by
  the rule `web-manager-limits` set: a manager reads every figure here and changes none.
- The address stays in the header, where it identifies the building, and is no longer
  run together with the figures that say how it bills.

## Capabilities

### New Capabilities

(None.)

### Modified Capabilities

- `web-buildings`: a building's own page states its configuration and lets the owner
  change it there.

## Impact

- Affected specs: `web-buildings`
- Affected code: `frontend/src/features/buildings/BuildingDetailPage.tsx` only. No API
  change: every field shown was already on `GET /buildings/:id`, and the fee catalogue
  already had a hook.
