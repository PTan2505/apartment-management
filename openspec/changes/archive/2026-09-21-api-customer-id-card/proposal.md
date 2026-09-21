## Why

An owner takes a photograph of the tenant's ID card when a tenancy is signed — it is
what identity is checked against, and what the paperwork is filled in from. Today that
photograph lives on their phone, and the details are typed into the form by hand from it.

It is also the input a later OCR step needs: the card is where a tenant's full name, date
of birth and card number come from, so having the images on file is the prerequisite for
filling those in automatically rather than by reading and typing.

## What Changes

- A customer records the two sides of their ID card, kept in the same object storage the
  signed contract already uses, uploaded straight from the browser with the bytes never
  passing through the API.
- The form that signs a tenancy takes both images, and attaches them to the person it
  signs for — a returning tenant already on file keeps the images they had unless new
  ones are chosen.
- A tenancy's page shows whether its signatory has an ID card on file, and lets it be
  viewed, replaced or removed.
- Nothing reads the images yet. OCR is a later change; this one exists so it has
  something to read.

## Capabilities

### Modified Capabilities

- `customer`: a customer can carry the two sides of their ID card
- `web-leases`: the signing form takes both sides, and the tenancy page shows what is on file

## Impact

- `backend/prisma/schema.prisma` and a migration — two nullable columns on the user record
- `backend/src/lib/storage.ts`, `backend/src/modules/customers/*`
- `frontend` lease form and lease detail
- Neon: the hosted database needs the same migration applied — steps at the end of tasks.md
