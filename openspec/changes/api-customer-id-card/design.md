## Context

- `lib/storage.ts` already signs uploads and downloads against Cloudflare R2, derives keys rather than accepting them, and treats "not configured" as a state every caller asks about first.
- The contract flow on a tenancy is three steps: `POST /leases/:id/contract-upload-url` signs a URL, the browser PUTs the bytes, `POST /leases/:id/contract` records the key after checking the object exists, is under the tenancy's prefix, and is within the size ceiling.
- Customers are `User` rows with `role: customer`. There is no customer detail screen; customers are reached through the list and through the tenancies they sign.
- `LeaseFormDialog` creates the customer (or resolves an existing one by phone) and then creates the tenancy, in that order.

## Goals / Non-Goals

**Goals.** The two images on file, attached to the person. The same upload mechanics as the contract, so there is one story about how files reach storage. Something for OCR to read later.

**Non-Goals.** Reading the card. Any extraction of name, date of birth or card number. A customer detail screen. Showing the images to the tenant in the portal.

## Decisions

### The card belongs to the customer, not the tenancy

A person has one ID card whatever they rent. Keying it to the tenancy would copy the same two photographs into every tenancy they sign, and leave a returning tenant's card behind on the tenancy that ended.

`User` gains `idCardFrontKey` and `idCardBackKey`, both nullable — the same shape as `Lease.contractKey`, and for the same reason: the database keeps a reference and the bytes stay in storage.

The API reports `hasIdCardFront` / `hasIdCardBack` rather than the keys. A key is an address in the owner's bucket; a screen only needs to know whether there is something to show.

### One prefix per customer, one object per side

`customers/{id}/id-card/` with the side and a random component in the object name. The prefix is what a confirmation is checked against, exactly as the contract's is, so a signed URL obtained for one customer cannot be turned into a write against another.

Replacing a side clears the other objects for THAT side only, so the two sides never interfere. The contract's `clearPrefixExcept` clears a whole prefix, which is right there and wrong here; this uses a side-scoped prefix instead.

### Images only, and a smaller ceiling than a contract

`image/jpeg`, `image/png`, `image/heic` — a card is photographed, not scanned to PDF. 10 MB: a phone photograph with room to spare, and half the contract's allowance because a contract may be many pages and a card is one.

### The form uploads AFTER the tenancy exists

The signing form already creates two records. The images are attached third, once the customer id is known and the tenancy is saved.

Ordering it this way means a failed upload cannot cost the owner the tenancy. It also means a failure has to be reported honestly — "the tenancy was created, the images were not attached" — rather than as a failed signing, and the tenancy's own page has to offer another way in. That page is where the images live afterwards anyway.

### Sensitive by nature

An ID card is identity, not paperwork. Three things follow, all of them already true of the contract and repeated here deliberately: the bucket is private and every read is a signed URL that expires in minutes; the API never returns the key; and removal deletes the object rather than only clearing the row.

## Risks / Trade-offs

**Images can outlive their purpose.** Nothing expires a card image when a tenancy ends. Deleting it is the owner's decision — they may have a legal reason to keep it — so the page offers removal rather than doing it on their behalf.

**A shared phone number.** The form resolves a returning tenant by phone. If two people share one, new images would replace the other person's. The existing "this number belongs to somebody else" guard stops the signing before that happens, and this change does not weaken it.
