## Why

A signed contract is several pages of paper, photographed with a phone. The system accepts exactly one file per tenancy, and accepts a PDF as readily as a photograph — so an owner with a four-page contract either photographs one page and loses the rest, or assembles a PDF somewhere else first.

The one-file limit is also why the screen cannot SHOW the contract. A single opaque "file" is reported as present or absent and opened through a signed link; four photographs are something an owner can read on the page, the way the ID card already works.

## What Changes

- A tenancy carries an ordered set of contract PHOTOGRAPHS rather than one file. Several can be uploaded at once.
- Each page can be removed on its own. Removing one leaves the others.
- The screen shows the pages as images, in order, rather than reporting presence and offering a link. Tapping one opens it full size, as the ID card does.
- Only images are accepted: JPEG, PNG, HEIC. **PDF and Word are no longer accepted** — the thing being recorded is what the owner photographed.
- `Lease.contractKey` is replaced by a table with one row per page, so a tenancy's pages have an order, an upload time, and identities of their own.

## Capabilities

### Modified Capabilities

- `lease`: a tenancy carries many contract pages rather than one file; each is added and removed on its own; only images are accepted.
- `web-leases`: the contract is shown as pages, added several at a time, and removed one at a time.

## Impact

- `backend`: new `LeaseContractPage` model and migration, `src/lib/storage.ts`, the contract endpoints on the lease module.
- `frontend`: `ContractCard`, the lease form's contract step, lease types.
- **Breaking for API callers:** the contract endpoints change shape, and PDF uploads are refused. The only caller is this frontend.
- Existing rows: the hosted database has none. Local test tenancies carrying a PDF lose their attachment — see the migration note in design.
