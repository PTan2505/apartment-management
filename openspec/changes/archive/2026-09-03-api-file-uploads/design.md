## Context

See proposal.md — Why. What shapes the approach:

- CLAUDE.md fixes the shape: object storage by presigned URL, scoped to a key prefix, short TTL, content-type and size constrained, and bytes never through Express. Lease onboarding is already three endpoints so the frontend can orchestrate the third.
- Env is validated fail-fast, and two features — the address lookup and the payment gateway — are already optional AS A GROUP, refusing partial configuration. Storage follows that pattern.
- No storage client is present today.

## Goals / Non-Goals

**Goals:**

- Keep the signed page with the record it is evidence for.
- Never hold a request open for the length of an upload.
- Make a signed URL useless for anything but the one write it was issued for.

**Non-Goals:**

- Documents on anything but a tenancy; more than one per tenancy.
- Any behaviour that reads the file.
- Deploying, or creating a bucket.

## Decisions

**Three steps, not one: sign, upload, confirm.**

A signed URL is issued before anything is uploaded, and the upload can fail after it — a closed tab, a dropped connection. Recording the contract at signing time would leave tenancies claiming a file that is not there, and nothing would ever check.

So the API records nothing until a confirmation, and the confirmation asks storage whether the object exists rather than believing the caller. That is one extra round trip on an operation performed once per tenancy.

**Size is enforced at confirmation; content type at signing.**

A presigned PUT can bind the content type, because it is a signed header the request must match. It cannot bind a size — that needs a presigned POST policy, a different and clumsier mechanism whose form fields the frontend would have to reproduce exactly.

So size is checked where it can be: after the upload, before anything is recorded. A file over the ceiling is refused **and deleted**, because the alternative is an object nobody can reach through the application and nobody will ever clear.

**The key is derived, never accepted.**

The caller names a file, not a destination. The key is built from the tenancy's own id and a random component, so a URL obtained for one tenancy cannot write anywhere else, and confirmation re-checks the key against that prefix rather than trusting what comes back.

The random component matters for replacement: reusing a key would mean a browser or a CDN could serve the old file for the new one.

**Replacing deletes the old object.**

Otherwise every replacement leaves a file nothing references — unreachable through the application, invisible in it, and paid for monthly. Deleting is done after the new one is confirmed, so a failure leaves the old contract in place rather than none.

**Cloudflare R2, and only R2.**

Chosen for v1 over AWS S3 because it charges nothing for egress, and for scanned contracts egress is the whole of the recurring cost — the files are written once and read whenever an argument needs settling.

Supporting both was written first and then removed on request. It is the right call: two providers means two configurations to explain, two to get wrong, and a code path that is only exercised by whichever one nobody is using. R2 speaks the S3 protocol, so the client library is named for S3 while no AWS service is involved.

Its address and region are derived rather than asked for — R2 signs against `auto` and its endpoint follows from the account id, so the configuration is four values with nothing to assemble.

**Storage is optional as a group.**

Same reasoning the payment gateway settled: an owner who does not want this must still be able to start the system. Partial configuration is refused, because a bucket with no credentials fails at the moment somebody tries to use it rather than at startup.

## Risks / Trade-offs

**The end-to-end upload cannot be verified here** → No bucket exists yet, and no local S3-compatible server is available. What IS verified is everything up to the network: that the signature names the right bucket and key, expires when it should, binds the content type, that the guards refuse an unconfirmed or oversized or out-of-prefix upload, and that an unconfigured system says so. What remains unverified is whether the bucket accepts it, which depends on bucket CORS and permissions — the setup being handed over. This is a real gap and is stated rather than glossed.

**A confirmed object could be replaced in storage afterwards** → Only by someone with credentials to the bucket, who has larger options than that. Not defended against.

**An upload URL leaks and is used by someone else** → It writes one key under one tenancy, expires in minutes, and the result would be refused at confirmation unless the owner also confirms it. The blast radius is one object the owner did not intend, which they can remove.

## Migration Plan

One additive nullable column, no backfill: existing tenancies have no contract, which is true. Storage settings are optional, so an existing deployment that sets nothing behaves exactly as it does now.
