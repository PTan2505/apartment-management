## Why

Somebody the owner has never met is sleeping in their building tonight, and nothing in
the system knows. The tenant's sister came to stay; the owner finds out by passing her on
the stairs, or does not find out at all.

In Vietnam this is also the landlord's legal problem, not only their curiosity: a guest
staying over is a temporary-residence registration, and the paperwork is the owner's to
file. Today the tenant texts a photograph of an ID card to a phone number, and that is
the whole system.

There is a second, quieter reason. Water and any per-person service fee are charged on
the tenancy's occupant count. A "visitor" who is still there in March is a person the
owner is housing and not billing — and nothing today would ever say so.

## What Changes

- **A tenant registers a visitor from the portal** — the link they already pay through —
  giving a name, an ID number, photographs of the ID card, and the dates.
- **The owner and the building's manager see who is registered**, on the tenancy and
  across their buildings.
- **A registration is its own record**, not a customer. Somebody who stays two nights
  should not appear in the list the owner picks a lease signatory from.
- **It changes no money.** Occupant count, water, per-person fees: untouched. This is a
  log.
- **A stay past two weeks is flagged**, because that is where a log stops being honest. A
  visitor still registered after fourteen days is probably an occupant, and the owner is
  shown it so they can decide — the system does not decide for them.
- **ID card images are handled like the ones already in the system**: uploaded straight to
  storage, read back through short-lived links, never proxied through the API.
- **The registration collects what the official form asks for** — date of birth, sex, where
  the person normally lives, how they are related to the signatory — at the one moment
  somebody is holding the identity document, instead of being reconstructed weeks later.
- **The system fills the form.** The owner uploads the blank CT01 once; from a tenancy they
  pick the registrations and get back a filled document to print, sign and submit. A family
  that arrived together is one form, which is how the form itself is built.
- **Nothing is guessed.** A box the system has no record for prints empty, and the owner is
  told which boxes those are before they print — not after the trip to the station.
- **The signatory's identity number becomes a field on the customer**, because today the
  system holds photographs of the card and not the number on it, and a photograph cannot be
  typed into a form.

## Capabilities

### New Capabilities

- `visitor`: who is staying in a room besides the people on the tenancy, and for how long.
- `residence-filing`: the temporary-residence paperwork, produced from those records
  instead of copied out by hand.

### Modified Capabilities

- `tenant-portal`: the link a tenant pays and reports faults through also registers a
  visitor.
- `web-tenant-portal`: the portal gains a page for it.
- `web-leases`: a tenancy shows who is registered, flags anyone past two weeks, and
  produces the filing.
- `customer`: a customer can carry the number on their identity document, not only
  photographs of it.
- `web-customers`: the add and edit forms carry that number.

## Impact

- Affected specs: `visitor` (new), `residence-filing` (new), `tenant-portal`,
  `web-tenant-portal`, `web-leases`, `customer`, `web-customers`
- Affected code: `backend/prisma/schema.prisma` (one table, one enum, one nullable column
  on `User`, + migration), `backend/src/lib/storage.ts` (two more key prefixes), new
  `backend/src/modules/visitors/*` and `backend/src/modules/residence-filing/*`, the
  customers module, the portal router, and the portal, tenancy and customers screens
- **One new dependency**: a `.docx` template filler. The blank form is a Word document
  because that is what the authorities publish and what the owner can replace themselves;
  nothing else in the project reads one today.
- **No change to billing, occupant count, or the revenue report.**
- **Privacy**: these are photographs of real identity documents. They are stored like the
  tenant ID cards already in the system and are subject to the same rule — the images are
  not opened or inspected during development or verification; only their presence, type
  and size are checked.
