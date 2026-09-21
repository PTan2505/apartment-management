## Context

Today: `Lease.contractKey` holds one storage key; `leases/{id}/contracts/` holds one object; confirming an upload sweeps everything else under that prefix; accepted types are PDF, JPEG, PNG and HEIC; the screen reports presence and offers a signed link.

The ID card, built later, does the opposite and better: the image is shown on the page, because the picture is the information.

## Goals / Non-Goals

**Goals.** A contract is as many photographs as it has pages, readable on the screen, each page addable and removable on its own.

**Non-Goals.** No OCR, no page reordering by hand, no PDF assembly. Nothing reads the pages — they remain evidence.

## Decisions

### One row per page, not an array on the lease

`LeaseContractPage`: `id`, `leaseId`, `key`, `contentType`, `uploadedAt`. Ordered by `uploadedAt`, then `id`.

A `String[]` column would hold the keys with less ceremony and take away everything else: a page could not be deleted by identity, only by value; nothing would record when each arrived; and the storage cleanup would have no row to compare against. The prefix is already per-tenancy, so the table is the only part that is new.

**Not storage-as-the-record, unlike the contract template.** That decision was right for a single system-wide file with nothing to say about it. Here the order and the arrival time matter, presence is asked for on a list screen where a per-row storage listing is out of the question, and listings lag writes — the template work found that the hard way.

### Only photographs

`image/jpeg`, `image/png`, `image/heic`. PDF and Word go.

Mixed types mean a page list where some entries display and some download, and a screen that handles both handles neither well. What an owner has is a phone and a piece of paper.

The hosted database is empty, so no real contract is affected. Local test tenancies that carry a PDF lose the attachment when `contractKey` is dropped — test data, and the migration says so rather than quietly carrying a type the new rules refuse.

### Cleanup becomes per-object, not per-prefix

The current rule — on confirmation, delete everything under the prefix except the key just confirmed — is exactly wrong once a tenancy has several pages: every other page is a legitimate object under that prefix.

The rule becomes: an object under the tenancy's prefix that no page row refers to is litter, and confirmation clears it. Same intent, same scope, computed against the record instead of against a single key.

### Uploading several at once

The file input takes `multiple`. Each file runs the same three steps as one file does — sign, PUT, confirm — and they are attempted in sequence rather than in parallel: a phone on a weak connection uploading four 8 MB photographs at once fails all four, and one at a time makes progress reportable and failures individual.

A failure part-way leaves the pages that succeeded attached. Reporting which one failed and keeping the rest beats an all-or-nothing that discards three good uploads because the fourth timed out — these are independent pages, not one document.

## Risks / Trade-offs

**An owner who has a PDF has to photograph the paper instead.** Deliberate: see the mixed-type reasoning. If a real owner turns out to keep PDFs, accepting them back is a smaller change than the screen work that would follow it.

**A tenancy could accumulate many pages.** Nothing prunes them. The size ceiling is per page; a contract with twenty pages costs twenty objects, which is what a twenty-page contract is.

**Removing `contractKey` is not reversible.** Local attachments are lost. Justified by the hosted database being empty; it would be the wrong call once real contracts exist.
