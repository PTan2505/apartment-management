## ADDED Requirements

### Requirement: A tenancy's storage keeps only its current contract

When a tenancy's contract is confirmed or removed, the system SHALL also remove any other object under that tenancy's own prefix.

An upload that is never confirmed leaves an object behind: the browser sends the file to storage and the confirmation then fails — a closed tab, a dropped connection, an error. Nothing is recorded, which is right, and the object remains, unreachable through the application and invisible in it.

This is the same reasoning that already deletes an oversized file rather than leaving it: an object nobody can reach through the application is one nobody will ever clear. Applying it to one case and not the other left a gap that grows with every failed upload and never shrinks.

The cleanup SHALL be scoped to the tenancy being acted on. Nothing SHALL sweep the bucket, and nothing SHALL run on a schedule — the litter is created by these operations, and clearing it as they happen keeps the two together.

A failure to clear SHALL NOT fail the operation. The record is what the application reads; reporting a successful confirmation as a failure because a stray object survived would invite the owner to repeat an upload that already worked.

#### Scenario: An abandoned upload is cleared

- **WHEN** an upload reaches storage but is never confirmed, and the owner then confirms a later one
- **THEN** the abandoned object is removed and the confirmed contract remains

#### Scenario: Removing a contract clears the prefix

- **WHEN** an owner removes a tenancy's contract
- **THEN** nothing is left under that tenancy's prefix

#### Scenario: Only this tenancy is touched

- **WHEN** a contract is confirmed for one tenancy
- **THEN** objects belonging to any other tenancy are untouched

#### Scenario: The current contract survives

- **WHEN** a contract is confirmed
- **THEN** the object it names is not among those removed
