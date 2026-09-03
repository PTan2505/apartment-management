## Why

A tenancy is an agreement, and the agreement is a piece of paper somebody signed. The system records everything about that agreement except the agreement: the rent, the term, the deposit, the people, the bills — and no way to keep the scan.

The consequence is that the record cannot settle an argument. When a tenant says the rent was different, or that no deposit was agreed, the figures in this system are one party's assertion. The signed page is the only thing that is not, and it lives in a drawer or a phone gallery, findable by nobody but the owner and not reliably by them.

It also breaks the one flow that was designed around it. Lease onboarding was deliberately split into separate endpoints so the frontend could orchestrate creating the tenant, creating the tenancy, and attaching the contract — and the third of those has never existed.

## What Changes

- **A tenancy can carry its signed contract.** One file, replaceable, removable.
- **The bytes never pass through the API.** The owner's browser uploads straight to storage using a short-lived URL the API signs. A scan of a contract is megabytes; putting them through the Express process would consume a request slot for the length of an upload on a phone connection, for no benefit — the process has nothing to do with the bytes.
- **A signed URL can only write one place.** It names the key it may write, under that tenancy's own prefix, so a URL obtained for one tenancy cannot be turned into a write anywhere else.
- **The upload is confirmed, not assumed.** The API records a contract only after checking the object is really there, because a signed URL is handed out before anything is uploaded and the upload can fail after it.
- **What is stored is checked**: a content type the owner would plausibly scan a contract as, and a size ceiling. Both are enforced where they cannot be talked around.
- **Reading it back is also a short-lived signed URL**, so the file is not public and no link to it survives being shared.
- **Storage is optional configuration.** An owner who does not want it must still be able to run the system, exactly as with the address lookup and the payment gateway.
- **Cloudflare R2, and only R2.** It charges nothing for egress, which for scanned contracts is the whole of the recurring cost. Supporting AWS S3 as well would mean two configurations to explain and two to get wrong, for a saving nobody asked for.

Deliberately NOT in this change:

- **Documents on anything but a tenancy.** A building's paperwork and a tenant's identity card are plausible and are not this.
- **More than one file per tenancy.** An amendment is a second agreement, and the shape that supports several is a different one.
- **Any change to what a tenancy means.** A contract file is evidence attached to the record, not part of it: nothing is derived from it and no rule reads it.

## Capabilities

### Modified Capabilities

- `lease`: a tenancy can carry its signed contract, uploaded directly to storage and retrievable by a short-lived link.

## Impact

- `backend/prisma/schema.prisma` — a tenancy records where its contract is kept. Migration required.
- `backend/src/config/env.ts`, `backend/.env.example` — storage settings, optional as a group.
- `backend/src/lib/` — the R2 client and URL signing.
- `backend/src/modules/leases/` — the three operations.
- `frontend/src/features/leases/` — choosing a file, uploading it, and reading it back.
- New dependency: the S3-protocol client and its presigner. Named for S3 because S3 is the protocol R2 speaks; no AWS service is involved.
