# Tasks

## 1. Clearing a prefix

- [x] 1.1 List the objects under a tenancy's prefix and delete all but a named one.
- [x] 1.2 Never fail the caller on a cleanup error. The record is what the application reads, and reporting a successful confirmation as a failure would invite the owner to repeat an upload that already worked — turning one piece of litter into two.

## 2. Where it runs

- [x] 2.1 At confirmation, keeping the newly confirmed key. This replaces the single-previous-object delete, which only ever caught the contract being replaced and never an abandoned upload.
- [x] 2.2 At removal, keeping nothing.
- [x] 2.3 Scoped to the one tenancy. Nothing sweeps the bucket.
- [x] 2.4 `tsc --noEmit`.

## 3. Verification, against a real bucket

- [x] 3.1 **Reproduce**: upload without confirming, and see the object still in storage.
- [x] 3.2 Confirm a later upload; the abandoned object is gone and the confirmed one remains.
- [x] 3.3 Remove the contract; nothing is left under the prefix.
- [x] 3.4 **Another tenancy's objects are untouched** by either operation.
- [x] 3.5 **Nothing else changed**: upload, confirm, download, replace and the oversized refusal all behave as they did.
- [x] 3.6 Remove the verification data, from the database and from the bucket.
