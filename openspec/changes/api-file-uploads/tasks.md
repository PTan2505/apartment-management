# Tasks

## 1. Configuration and storage

- [x] 1.1 Storage settings, optional AS A GROUP and refused when partially set — a bucket with no credentials fails when somebody tries to use it rather than at startup. Mirrored in `.env.example`.
- [x] 1.2 A storage client that reports itself unconfigured rather than throwing on import, so the rest of the system runs without it.
- [x] 1.3 Signing for upload and for reading, with expiry in minutes. A signed URL authorises a write to the owner's storage and its useful life is one upload.

## 2. The three operations

- [x] 2.1 Issue an upload URL: derive the key from the tenancy and a random component, bind the content type, return the key and the expiry.
- [x] 2.2 **Never accept a key from the caller.** The caller names a file, not a destination; otherwise a URL for one tenancy writes anywhere.
- [x] 2.3 Confirm: ask STORAGE whether the object exists rather than believing the caller. A URL is issued before anything is uploaded and the upload can fail after it.
- [x] 2.4 Enforce the size ceiling at confirmation and DELETE an oversized object. A presigned PUT cannot bind a size, and an object nobody can reach through the application is one nobody will ever clear.
- [x] 2.5 Refuse a confirmation naming a key outside that tenancy's prefix.
- [x] 2.6 Replace: record the new contract, then delete the old object — in that order, so a failure leaves the old one rather than none.
- [x] 2.7 Read back by short-lived signed URL; 404 where there is no contract.
- [x] 2.8 Remove: clear the record and delete the object.
- [x] 2.9 Report on the tenancy whether it has a contract.
- [x] 2.10 `tsc --noEmit`.

## 3. The screen

- [x] 3.1 Show whether a tenancy has a contract, and offer to attach one.
- [x] 3.2 Upload straight to storage from the browser, then confirm — never through the API.
- [x] 3.3 Say what may be uploaded and how large, before a file is chosen rather than after it is rejected.
- [x] 3.4 Offer to view and to remove, with removal saying it cannot be undone.
- [x] 3.5 Say plainly where storage is unconfigured, rather than offering an action that cannot work.
- [x] 3.6 Typecheck and build.

## 4. Verification

**The end-to-end upload cannot be verified here** — the bucket does not exist yet, and no local S3-compatible server is available. Everything up to the network is verified; the network hop is handed over with setup instructions.

- [x] 4.1 **Unconfigured storage**: the system starts, every other endpoint works, and asking for an upload URL says storage is unconfigured.
- [x] 4.2 **Partial configuration refuses to start**, naming what is missing.
- [x] 4.3 With storage configured, an upload URL is signed: **assert the R2 endpoint, the bucket, the key prefix, the tenancy id in the key, the bound content type, and an expiry in minutes** — read out of the signed URL itself.
- [x] 4.4 Two requests for the same tenancy produce DIFFERENT keys, so a replacement cannot be served from a cache of the old one.
- [x] 4.5 A confirmation for an object that is not in storage is refused and records nothing.
- [x] 4.6 A confirmation naming a key outside the tenancy's prefix is refused.
- [x] 4.7 An unsupported content type is refused at signing.
- [x] 4.8 Every contract endpoint answers 401 unauthenticated.
- [x] 4.9 **Nothing else changed**: a tenancy with no contract behaves exactly as before, and leases, invoices and reports are unaffected.
- [x] 4.10 On the screen: the state is shown, the unconfigured case says so, and the limits are stated before a file is chosen.
- [x] 4.11 Remove the verification data.
