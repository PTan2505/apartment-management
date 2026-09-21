## Why

The terms card on a tenancy shows five fields. The owner read them and could not tell what they were for — so the fields were traced through the backend rather than guessed at, and the answer is that four of the five are recorded and acted on by nothing.

One of the five is worse than useless: **the opening water reading**. It sits beside the electricity reading, which every bill consumes — but water is billed per person (`số người × giá nước/người`), so this number has never been multiplied by anything. The spec that introduced it says "water is billed on metered consumption exactly as electricity is", and that is simply not true of this system.

Tracing them also turned up a defect: **a renewed tenancy has no reference at all.** Signing sets one; renewing creates the successor and never does. Two of sixty-six tenancies in the local database have `reference = null`, and the screen renders that as a label with nothing underneath — which is how it was noticed.

## What Changes

- **Fix:** a renewal gives its successor a reference, built the same way as every other. Existing null references are back-filled by the same migration.
- **Removed outright — column, API field and screen:** `noticeDays`, `paymentDay`, `startWaterReading`. None is read by anything; the water reading actively misleads by sitting beside a meter reading that every invoice consumes. The hosted database holds no real data yet, so dropping the columns destroys nothing a user recorded, and leaving three dead columns behind would make the next reader guess whether they are still wanted.
- The terms card shows **the reference** and **the date the paper contract was signed**.
- That signing date is asked for **when a tenancy is signed**, not only afterwards in the correction dialog — that is the moment the owner has the paper in front of them.
- Each row of the terms card spreads across the card instead of bunching at the left.
- **New:** a renewal records which lease it renewed. Until now nothing linked a successor to its predecessor, so "is this tenancy a renewal, and of what?" was unanswerable — and unanswerable even by inference, since a different tenant moving in on changeover day leaves the same trace. Both tenancies now name each other on screen, each as a link.
- **Spec correction:** the claim that water is billed on metered consumption is removed. It was never true here.

**On the notice period specifically:** it cannot be enforced as the schema stands, because enforcement needs a fact the system has never held — the date the tenant gave notice. Comparing a move-out against the expected end date answers a different question. If notice matters later, it comes back as a change that records when notice was given; a column nothing writes to is not a head start on that.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `lease`: a renewal records which lease it renewed; the three unused terms are gone; what remains is a reference every tenancy carries — renewals included — and the paper contract's signing date.
- `web-leases`: the tenancy screen shows the reference, the signing date, and the renewal chain in both directions; the signing date is asked for at signing.

## Impact

- `backend`: the renewal path, the lease schema, the mapper, `prisma/schema.prisma`, and two migrations — one dropping three columns and back-filling references, one adding the renewal link.
- `frontend`: `LeaseDetailPage`, `EditTermsDialog`, `LeaseFormDialog`, lease types.
- **Breaking for API callers:** `noticeDays`, `paymentDay` and `startWaterReading` are no longer accepted on create or update, and no longer reported. The only caller is this frontend.
- New Vietnamese strings, reported for review rather than chosen silently.
