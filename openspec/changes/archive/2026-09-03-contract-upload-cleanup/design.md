## Context

See proposal.md — Why. What exists:

- Contract objects live under `leases/<id>/contracts/`, one per upload, keyed with a random component so a replacement never reuses a key.
- Confirmation already deletes the previous contract; oversized files are already deleted.
- `contractKey` records the one object the application knows about. Anything else under the prefix is, by definition, referenced by nothing.

## Goals / Non-Goals

**Goals:**

- Stop accumulating objects nothing references.
- Keep the cleanup where the litter is made.

**Non-Goals:**

- Sweeping the bucket, or any scheduled job.
- Changing the upload's three steps or what is recorded.

## Decisions

**Clean the prefix at confirm and at remove, not on a schedule.**

Those are the two moments a tenancy's storage changes, and both already talk to storage — so the cleanup costs one extra listing on an operation performed rarely. A scheduled sweep would need somewhere to run, a way to be sure it is running, and a reason to trust it against a whole bucket.

**Delete by "not the current key", rather than by age.**

The prefix contains at most one object the application references. Everything else is litter by construction, so the rule needs no clock and no guess about how long an upload might take.

A race exists and is acceptable: a slow upload in one tab, finishing after a fast one in another has been confirmed, would have its object deleted and its own confirmation refused with "that file is not in storage". The owner retries. That is self-correcting, and the alternative — keeping everything for a grace period — trades a certain permanent leak for an uncertain temporary one.

**A lifecycle rule was rejected.**

Confirmed contracts share the prefix with abandoned uploads, so an age-based rule would delete real contracts. Splitting them — uploading to a staging prefix and copying on confirm — would make lifecycle rules viable, at the cost of a copy on every upload and two prefixes to reason about. Not worth it for a leak this size.

**A failed cleanup does not fail the operation.**

The record is what the application reads. Reporting a successful confirmation as a failure because a stray object survived would invite the owner to repeat an upload that already worked — turning one piece of litter into two.

## Risks / Trade-offs

**Two uploads in flight, one deleted** → Described above: the loser's confirmation is refused in terms it can act on, and retrying works.

**A listing costs a request** → One per confirm or remove, on an operation performed a handful of times per tenancy in its life.

## Migration Plan

None. Objects already orphaned are cleared the next time that tenancy's contract changes; any belonging to a tenancy that never changes again remain, and can be removed from the Cloudflare dashboard.
