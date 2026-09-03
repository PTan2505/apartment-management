## Why

Found by running the contract upload against a real bucket, immediately after the feature merged: **an object uploaded but never confirmed stays in storage forever.**

It happens on the ordinary failure. The browser sends the file to storage, and then the confirmation does not arrive — the tab is closed, the connection drops, the API answers an error. Nothing is recorded, which is correct; but the object is there, unreachable through the application, invisible in it, and paid for every month.

This contradicts reasoning the feature already applies. An oversized file is deleted at confirmation, on the grounds that an object nobody can reach through the application is one nobody will ever clear. That is exactly true of an abandoned upload, and it was left behind.

The gap is small per occurrence and unbounded over time: every failed upload adds one, and nothing ever removes them.

## What Changes

- **A tenancy's storage is tidied when its contract changes.** Confirming an upload, or removing a contract, also removes anything else under that tenancy's own prefix — which is precisely the objects nothing references.
- Scoped to the one tenancy being acted on. Nothing sweeps the bucket, and nothing runs on a schedule: the cleanup happens as a side effect of the operations that create the litter.

Deliberately NOT in this change:

- **A lifecycle rule on the bucket.** Confirmed contracts live under the same prefix as abandoned ones, so an age-based rule would delete real contracts. Separating them into a staging prefix would work and is more machinery than this needs.
- **Any change to what is recorded**, or to the three steps of an upload.

## Capabilities

### Modified Capabilities

- `lease`: changing a tenancy's contract also clears whatever else is left under its prefix.

## Impact

- `backend/src/lib/storage.ts` — listing and deleting under a prefix.
- `backend/src/modules/leases/service.ts` — the two places a contract changes.
- No API change. No data change. No change to any figure or rule.
