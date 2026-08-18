## Why

Buildings are the root of this system — rooms belong to them, leases belong to rooms, invoices and expenses hang off both. The API has supported managing them since `api-property-room`, and the frontend has shown a placeholder saying so.

This is also the first screen with real data in it, which makes it the template. Six more list screens follow — rooms, customers, leases, invoices, expenses, and the revenue report — and each will copy how this one filters, pages, renders on a phone, and reports a rejected action. Getting the shape right here is worth more than getting it fast.

## What Changes

- Replace the buildings placeholder with a working screen: the buildings the owner manages, with their location, utility rates, and whether they are in service.
- Filter by city and ward, chosen from the values actually in use rather than typed. The ward choices narrow to the selected city.
- Include retired buildings on request; they are hidden by default.
- Page through the results, with the page reset whenever the filters change.
- Create and edit a building through a form that adapts to the viewport, validating what the API validates and no more.
- Retire a building behind a confirmation, and restore a retired one without. When the API refuses because a room still has an active lease, say so in the API's own words.
- Render as a table on desktop and as cards on a phone, since a table of this width cannot usefully shrink.
- Distinguish having no buildings from having no buildings that match the current filters.

### Why choices instead of typing

The city and ward filters exist to answer "which buildings are in this area". Asking the owner to type the answer does not work here: the database folds case for ASCII only, so `đức` does not find `Thủ Đức`. `api-building-locations` exists precisely so a client can offer the stored values as choices — a value taken from that endpoint matches its building exactly, with no folding involved.

### A display defect this change has to fix first

`formatMoney` rounds to whole dong, which is correct for invoice totals and wrong for rates:

```
  formatMoney(3000000)   →  3.000.000 ₫    an amount, correct
  formatMoney(3500.5)    →  3.501 ₫        a rate, shown as a different number
```

Buildings is the first screen to display a rate, so it is the first place this shows. Amounts are whole by construction; rates are `Decimal(12,4)` and genuinely fractional. They need separate formatting rather than a shared default that silently rounds one of them.

## Capabilities

### New Capabilities
- `web-buildings`: managing buildings from the browser — finding them by location, paging through them, creating and editing them, and taking them in and out of service.

### Modified Capabilities
- `web-infrastructure`: "Monetary values are numbers before any screen uses them" — adds that displaying a value must not change it, so a fractional rate cannot be rounded into a different number on its way to the screen.

## Impact

- **Code**: new `frontend/src/features/buildings/`; `lib/format.ts` gains rate formatting; the buildings placeholder page and its route are replaced. Small shared additions for list-screen mechanics that every following screen needs.
- **Backend**: none. Every endpoint this uses is already merged, including `GET /buildings/locations`.
- **Dependencies**: no new packages.
- **Behavioral change**: the buildings destination stops being a placeholder. Nothing else changes.
- **Dependencies on other work**: requires `web-auth` and `api-building-locations`, both merged. Blocks `web-rooms`, which needs a building to belong to.
- **Out of scope**: no building detail page — its purpose is to host the rooms in a building, which arrives with `web-rooms`. No address autocomplete; that is `api-address-lookup` and lands in this form afterwards. No deleting buildings, since the API deliberately does not support it. No generic list abstraction — this change builds one concrete screen, and what genuinely repeats is extracted when the second screen shows what that is.
