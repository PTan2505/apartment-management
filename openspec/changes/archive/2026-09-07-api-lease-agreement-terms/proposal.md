## Why

A lease records what it takes to bill a tenancy — rent, deposit, dates, occupant count, meter start. It does not record several terms that are in the agreement the tenant signed and that an owner is asked about: what the contract is called, how much notice a departure needs, which day of the month rent falls due, and what the water meter read on the day they moved in.

Those came up together while redesigning the lease detail screen. The design shows every one of them; none could be built, because the record does not hold them. They were named in that change's proposal and then archived, which is where a deferred decision goes to be forgotten — the point of writing this down is that it stops being forgotten.

The water reading is the sharpest of them. The electricity reading is recorded at move-in and used to bill electricity; water is billed too, and its opening reading is nowhere. Today that is invisible because nothing reads it back; the moment somebody disputes a water bill, there is no agreed starting point to appeal to.

## What Changes

- A lease SHALL record the notice a departure requires, and the day of the month its rent falls due.
- A lease SHALL record the opening WATER meter reading beside the electricity one it already records.
- A lease SHALL be identifiable by a human-readable reference, distinct from its database id, so an owner and a tenant can name the same agreement out loud.
- A lease SHALL report whether the handover record has been signed.
- The lease endpoints SHALL report all of the above, and accept them where they are part of signing or correcting an agreement.

### Explicitly out of scope, and why

**`Đã đối soát chữ ký`** — a signature-verification state. It implies a verification workflow that does not exist, and inventing a boolean for it would record a claim nobody has made.

**The contract file's name, size and upload time.** Withheld on purpose today: the storage key never reaches the browser and every link is signed when it is asked for. Reporting the name and size means carrying them separately, and the security property is worth more than the line of text.

**An invoice's due date, bank-reconciliation flag and receipt number**, and the `Nhắc phí` action. All four are about collecting money rather than about the terms of an agreement, and they belong with the invoice and payment capabilities rather than here.

**Room-level revenue detail** — see `api-report-detail`.

## Capabilities

### Modified Capabilities

- `lease`: an agreement records and reports its notice period, its payment day, its opening water reading, its reference, and whether handover was signed.

## Impact

- `backend/prisma/schema.prisma` — new columns on `Lease`, and a migration.
- `backend/src/modules/leases/` — schema, service and the reported shape.
- The existing lease-detail screen can then show these terms. That is a separate frontend change.
- **Existing leases have none of these values.** How they read for a tenancy signed before this change is the substance of the design, not a detail: the wrong answer invents terms nobody agreed to.
