## REMOVED Requirements

### Requirement: A tenancy can carry its signed contract

**Reason**: It required exactly one contract file per tenancy, and required replacing it to leave the tenancy with exactly one. A contract is several pages of paper; one file per tenancy meant an owner photographing a four-page agreement had to assemble a document elsewhere before the system would take it.

**Migration**: `Lease.contractKey` is replaced by one row per page. Replaced by "A tenancy carries the pages of its signed contract" below, which keeps the evidence-only rule — no rule reads the pages, no reported value derives from them — and the rule that removed pages leave no object behind in storage.

### Requirement: A tenancy's storage keeps only its current contract

**Reason**: It required every object under a tenancy's prefix other than the current contract to be swept away on each confirmation. With many pages, every other page IS a legitimate object under that prefix, so a sweep that keeps one would delete the rest.

**Migration**: None. The intent — an upload that reaches storage but is never confirmed must not accumulate — survives in "An unconfirmed upload does not accumulate" below, scoped to the object it concerns rather than to the prefix.

## ADDED Requirements

### Requirement: A tenancy carries the pages of its signed contract

The system SHALL allow an authenticated `owner` to attach one or more PHOTOGRAPHS of a tenancy's signed contract, to add further pages later, to remove any one of them, and to retrieve them.

The record cannot otherwise settle an argument. When a tenant says the rent was different or that no deposit was agreed, every figure in the record is one party's assertion; the signed page is the only thing that is not — and an agreement is several pages, not one.

The pages SHALL be reported in a stable order, oldest first, so a contract read on a screen reads in the order it was photographed.

Each page SHALL be removable on its own, and removing one SHALL leave the others attached.

The pages SHALL be evidence attached to the record and nothing more. No rule SHALL read them, and no reported value SHALL derive from them — a tenancy with no contract pages SHALL behave in every other way exactly like one that has them.

#### Scenario: Attaching several pages

- **WHEN** an authenticated owner attaches three photographs to a tenancy
- **THEN** the tenancy reports three pages, in the order they were added

#### Scenario: Adding a page later

- **WHEN** an owner attaches another photograph to a tenancy that already has pages
- **THEN** it joins the existing pages rather than replacing them

#### Scenario: Removing one page

- **WHEN** an owner removes one page of several
- **THEN** that page is gone from the record and from storage, and the others remain attached

#### Scenario: Removing the last page

- **WHEN** an owner removes the only page a tenancy has
- **THEN** the tenancy reports no contract pages

#### Scenario: A tenancy without any behaves normally

- **WHEN** a tenancy has no contract pages
- **THEN** every other operation on it behaves exactly as it does today

### Requirement: A contract page is a photograph

The system SHALL accept JPEG, PNG and HEIC for contract pages, and SHALL refuse anything else — including PDF and word-processor documents.

What is being recorded is what the owner photographed. Accepting a document as well means a tenancy's contract can be a mixture of pages that display and files that download, and a screen that has to handle both shows neither well.

Each page SHALL be subject to the same size ceiling as before, enforced at confirmation, and an oversized object SHALL be deleted rather than left unreachable in storage.

#### Scenario: A photograph is accepted

- **WHEN** an owner uploads a JPEG, PNG or HEIC page
- **THEN** it is accepted and attached

#### Scenario: A PDF is refused

- **WHEN** an owner requests an upload URL for a PDF
- **THEN** the system refuses and no URL is issued

#### Scenario: An oversized page

- **WHEN** a confirmed page is larger than the ceiling
- **THEN** it is refused and the object is deleted from storage

### Requirement: An unconfirmed upload does not accumulate

Where an upload reaches storage and is never confirmed, the system SHALL ensure the object does not remain unreachable forever.

The browser sends the file to storage and the confirmation then fails — a closed tab, a dropped connection, an error. Nothing is recorded, which is right, and the object remains: invisible in the application and impossible to clear through it.

The cleanup SHALL be scoped to what is known to be litter. With several pages legitimately under one tenancy's prefix, a sweep that keeps only the newest would delete the rest, so the rule is per-object and not per-prefix: an object under a tenancy's prefix that no page row refers to is litter.

A failure to clear SHALL NOT fail the operation. The record is what the application reads.

#### Scenario: An abandoned upload is cleared

- **WHEN** an upload reaches storage but is never confirmed, and the owner then confirms a later page
- **THEN** the abandoned object is removed and every recorded page remains

#### Scenario: Recorded pages are never swept

- **WHEN** a page is confirmed for a tenancy that already has pages
- **THEN** the existing pages remain in storage and on the record

#### Scenario: Only this tenancy is touched

- **WHEN** a page is confirmed for one tenancy
- **THEN** objects belonging to any other tenancy are untouched
