## REMOVED Requirements

### Requirement: A lease records the terms of its agreement, not only what it takes to bill

**Reason**: It required a lease to record the notice a departure requires, the day rent falls due, and the opening water meter reading. All three were written, reported, and read by nothing: no move-out consults the notice, no invoice carries a due date derived from the payment day, and water is billed per occupant so no meter reading enters any calculation. The requirement also asserted that water is billed on metered consumption exactly as electricity is, which was never true of this system — it is the sentence that made the water reading look like a billing input.

**Migration**: The three columns are dropped. The hosted database holds no real data yet, so nothing recorded by a user is lost; local test values go with them. What survives is replaced by "A lease carries a reference and the date its paper contract was signed" below. If notice ever needs enforcing, it needs a second fact this system has never held — the date the tenant gave notice — and that is a change of its own, not a column waiting to be used.

### Requirement: A term that was never agreed is reported as absent, not as a default

**Reason**: It existed to protect three terms that no longer exist, and its sharpest scenario is about a water reading of zero — a value the schema no longer has anywhere to put.

**Migration**: None. The principle survives for the terms that remain, in "A term that was never agreed is reported as absent" below.

## ADDED Requirements

### Requirement: A lease carries a reference and the date its paper contract was signed

A lease SHALL record and report a human-readable reference for the agreement, and the date the paper contract was signed with the tenant.

The reference SHALL be distinct from the record's identifier. An id is what the system uses; a reference is what two people say out loud to be sure they mean the same agreement, and an owner reading a number out of a URL is using the wrong one.

The reference SHALL be generated and SHALL NOT be accepted from a caller. A typed reference drifts: two leases get the same one, a typo makes one unfindable, and the field becomes a place people write notes.

EVERY lease SHALL have a reference, however it came to exist. A lease created by renewing another is a lease, and one without a reference cannot be named out loud at all — the gap is invisible until someone asks for the number and there is none to give.

The signing date SHALL be accepted when the lease is created as well as when it is corrected. It is a fact the owner holds at signing and rarely goes looking for later.

#### Scenario: Reading the reference and signing date

- **WHEN** an authenticated owner retrieves a lease
- **THEN** its reference and its signing date are reported with its other terms

#### Scenario: A reference is not accepted from the caller

- **WHEN** an owner creates a lease and supplies a reference of their own
- **THEN** the lease is created with the generated reference, not the supplied one

#### Scenario: A renewed tenancy carries its own reference

- **WHEN** a tenancy is renewed and a successor lease is opened
- **THEN** the successor has a reference of its own, built the same way as one created by signing, and distinct from its predecessor's

#### Scenario: A lease left without a reference

- **WHEN** a lease exists with no reference recorded
- **THEN** it is given one, so that no lease is left unnameable

#### Scenario: Recording the signing date at creation

- **WHEN** an owner creates a lease and supplies the date the paper contract was signed
- **THEN** the lease records it and reports it back

### Requirement: A term that was never agreed is reported as absent

Where a lease has no signing date recorded, the system SHALL report it as absent, and SHALL NOT substitute a default.

A default would state as agreed something nobody agreed to, on a record that reads as a contract, and a reader has no way to tell a recorded date from an assumed one.

The system SHALL NOT require it in order to accept a correction to a different term. Demanding a fact that was never recorded, as the price of fixing a rent, converts missing history into an obstacle.

#### Scenario: A tenancy recorded without its signing date

- **WHEN** an owner retrieves a lease whose paper contract date was never entered
- **THEN** the date is reported as absent rather than as a default value

#### Scenario: Correcting one term without supplying the other

- **WHEN** an owner corrects the rent of a lease that has no signing date recorded
- **THEN** the correction is accepted, and the signing date stays absent

### Requirement: A renewal records which lease it renewed

Where a lease is created by renewing another, it SHALL record which lease that was, and both leases SHALL report the link.

Written at the moment of renewal, because that is the only moment the link is a fact. Afterwards it could only be inferred from a room and two dates — and a DIFFERENT tenant moving in on changeover day produces exactly the same pattern, so the inference is not merely awkward but wrong in a case that happens routinely.

A lease SHALL be renewable at most once, and the system SHALL enforce that where it cannot be bypassed rather than only in the code path that happens to check. Renewing closes the predecessor, and a closed lease cannot be renewed again.

A lease that was signed rather than renewed, and one that has not been renewed, SHALL report the corresponding link as absent. Absent here means "this did not happen", not "this was not recorded".

Leases renewed before this existed SHALL keep no link. The renewal left no record of having happened, and inventing one from matching dates is exactly the inference this replaces.

#### Scenario: The successor names its predecessor

- **WHEN** a tenancy is renewed
- **THEN** the successor reports which lease it renewed, and the predecessor reports which lease renewed it

#### Scenario: A tenancy that was signed, not renewed

- **WHEN** an owner retrieves a lease created by signing
- **THEN** it reports no lease that it renewed

#### Scenario: A tenancy that has not been renewed

- **WHEN** an owner retrieves a running lease
- **THEN** it reports no lease that renewed it

#### Scenario: One renewal per lease

- **WHEN** two renewals of the same lease are attempted
- **THEN** the second is refused, and the refusal comes from the database's own constraint rather than from a check that could be bypassed
