## Why

`/customers` is still a placeholder. It is the last screen the lease workflow depends on: a lease is signed by a customer, so leases cannot be built until customers can be found and created from the browser.

The search this screen needs was the thing blocking it, and it now works — the API matches a customer's name whether or not the query carries diacritics or matches the stored casing. This screen is its first consumer.

## What Changes

- Replace the `/customers` placeholder with a working screen: a searchable, paginated list of customers, adapting to the viewport the way the buildings and rooms screens do.
- Add a create dialog and an edit dialog.
- Handle the three distinct outcomes `POST /customers` can produce, which is the substance of this change. The endpoint is find-or-create rather than create: a phone number already on file returns the person who holds it instead of creating anyone, and the submitted name is discarded. Reporting that as a success would leave the owner believing they created a person who does not exist.
- Show an absent phone number as a dash rather than as blank space, since a customer may legitimately have none.

Deliberately out of scope:

- **No detail page.** A customer record holds only a name, a phone number, and timestamps; a page showing that and nothing else earns nothing. The question worth answering — which rooms this person is renting — belongs to `web-leases`, and answering it here would mean writing lease UI ahead of its change.
- **No retire, restore, or delete.** The API offers none, so the screen offers none. A customer's row carries exactly one action.
- **No duplicate-name warning** when creating a customer without a phone number. The API deliberately does not match on name, and shared names are ordinary in Vietnamese; a warning that fires mostly on people who are genuinely different teaches the owner to ignore it.

## Capabilities

### New Capabilities

- `web-customers`: managing customers from the browser — finding them by name or phone, creating them, and correcting their details.

### Modified Capabilities

None. The customer API already provides everything this screen needs, so no backend requirement changes.

## Impact

**Frontend only.** No backend change, no migration, no new dependency.

**New:** a `features/customers/` module following the shape the rooms module established — `api.ts`, `hooks.ts`, `types.ts`, `schema.ts`, a list, a form dialog, and a page.

**Reused unchanged:** `useListParams`, `SearchField`, `Pagination`, `EmptyState`, and the responsive table-and-cards pattern.

**Not reused:** the row-actions and retire-dialog components from rooms. Customers have no lifecycle to act on, so a row needs one button rather than a menu.

**Routing:** `/customers` stops resolving to the placeholder and resolves to the real page. The navigation entry already exists and does not change.
