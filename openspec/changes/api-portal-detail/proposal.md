## Why

The portal reports a tenant's bills and the charges inside them. It does not report the things a tenant reaches for when a number looks wrong: which building this is, when the bill is due, when the one they already paid was settled, and who to call.

That last one matters most. The portal is opened by somebody with a question, and the screen's answer to "this looks wrong" is currently nothing at all — no number, no name. The tenant's route is to find the owner's phone number somewhere else, which is the moment a self-service page stops being self-service.

The design for the portal screen showed all of these; none could be built. They are recorded here rather than in an archived proposal, which is where the last three redesigns' deferred work went to be forgotten.

## What Changes

- The portal SHALL report the building a bill's room belongs to, so a tenant with rooms in two places can tell them apart, and so the page can say where it is about.
- A settled bill SHALL report when it was settled, rather than only that it was.

### Removed from this change once the code was read

**Transfer details that can be read without creating a payment.** This was the change's headline, and it cannot be built against this gateway. Reading the code answered the question the task list put first — what does reconciliation actually match on — and the answer removes the feature:

- the reference is `orderCode`, which is the payment row's own id, created with the attempt;
- the receiving account is a VIRTUAL account the gateway allocates per attempt, never the owner's, and it is how an incoming transfer is matched back.

So there is no account and no reference that exists before a payment does. A read would have to invent both, and money sent to an invented account is money the gateway never sees. The API's shape was right all along: details that are created with an attempt belong to the request that creates it.

This also settles the portal redesign's decision in the same direction, for a better reason than the one recorded there. Showing the block on arrival would not merely have created spurious payment records — it would have allocated a fresh virtual account on every page view, leaving several live at once for one bill.

**Who to contact about a bill.** Removed for the same kind of reason as the transfer details, found the same way. `Building` has no owner: the schema's only relations to `User` are refresh tokens, portal tokens and lease occupancy, and none of them says whose building this is. Reporting "the owner" would mean picking the one user with that role and attaching them to every bill — correct today, because v1 has one owner, and silently wrong the day there are two, when one owner's number would be shown to the other's tenants. Giving a building an owner is a data-model decision, not a field, and belongs to its own change.

**A due date.** Moved to `api-lease-agreement-terms`, which adds the lease's payment day. A nullable column here would be a migration for a field nothing can populate, reported as absent on every bill until that change lands. It belongs with the term that fills it in.

### Out of scope

**A reconciliation period and a data-freshness timestamp.** The design shows both. Neither is about the portal holding more of what a tenant needs; they describe how current the page is, which is a different question and probably a different answer — a portal that says "updated at 16:30" while showing a bill paid at 16:45 is worse than one that says nothing.

**Making the portal link expire.** The design asserts a seven-day validity that this system does not implement. Whether it SHOULD is a real security decision with a real cost — a tenant losing access and an owner resending links — and it belongs to its own change, not to a field addition.

## Capabilities

### Modified Capabilities

- `tenant-portal`: the portal reports the building a bill is from, and when a settled bill was settled.

## Impact

- `backend/src/modules/tenant-portal/` — the reported shape only. No new endpoint, no schema change, no migration.
- The mapper's own comment lists the building among what it deliberately withholds. That reasoning is revised rather than ignored: a building's NAME is where the tenant lives, not how the system is organised, and the ids stay withheld.
- The portal screen can then show what its design calls for. That is a separate frontend change.
