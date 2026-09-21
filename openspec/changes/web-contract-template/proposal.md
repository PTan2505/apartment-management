## Why

The owner prints a blank contract to sign with each new tenant. Today that file lives on
their own machine, so it is not on the screen where tenancies are signed, and there is no
one copy everybody agrees is current.

## What Changes

- The system keeps one blank contract template, uploaded straight to object storage from
  the browser, the same way a signed contract and an ID card already are.
- The tenancies screen shows whether a template is on file and offers to download it for
  printing, replace it, or remove it.
- No database table and no migration: the template is one object under one fixed prefix,
  and storage is the only thing that knows about it.

## Capabilities

### New Capabilities

- `contract-template`: one blank contract the owner keeps for printing

### Modified Capabilities

- `web-leases`: the tenancies screen offers the template

## Impact

- `backend/src/lib/storage.ts`, a small `contract-template` module, one route group
- `frontend` tenancies screen
- Nothing to apply on Neon — this change adds no columns
