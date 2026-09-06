## ADDED Requirements

### Requirement: A lease records the terms of its agreement, not only what it takes to bill

A lease SHALL record, and report, the notice a departure requires, the day of the month its rent falls due, the opening WATER meter reading, a human-readable reference for the agreement, and whether the handover record has been signed.

These are terms of the agreement the tenant signed. An owner asked "how much notice do I have to give" is reading a paper contract today, because the system that governs the tenancy does not hold the answer.

The opening water reading SHALL be recorded the same way as the opening electricity reading. Water is billed on metered consumption exactly as electricity is; recording the start of one and not the other means a water dispute has no agreed starting point to appeal to.

The reference SHALL be distinct from the record's identifier. An id is what the system uses; a reference is what two people say out loud to be sure they mean the same agreement, and an owner reading a number out of a URL is using the wrong one.

#### Scenario: Signing an agreement with its terms

- **WHEN** an owner creates a lease and supplies the notice period, payment day and opening water reading
- **THEN** the lease records them and reports them back

#### Scenario: Reading the terms

- **WHEN** an authenticated owner retrieves a lease
- **THEN** its notice period, payment day, opening water reading, reference and handover state are reported with its other terms

#### Scenario: Correcting a term

- **WHEN** an owner corrects the notice period or payment day of a running tenancy
- **THEN** the corrected value is recorded, under the same rules that govern correcting its other terms

### Requirement: A term that was never agreed is reported as absent, not as a default

Where a lease has no value recorded for one of these terms, the system SHALL report it as absent, and SHALL NOT substitute a default.

Every tenancy signed before these terms existed has none of them. A default — thirty days' notice, the fifth of the month, a water reading of zero — would state as agreed something nobody agreed to, on a screen that reads as a contract. A reader has no way to tell a recorded thirty days from an assumed one.

A water reading of zero is the sharpest case, because zero is a legitimate reading. "No reading was recorded" and "the meter read zero" are different facts and SHALL be reported differently.

The system SHALL NOT require these terms on an existing lease in order to accept a correction to a different one. Demanding a term that was never agreed, as the price of fixing a rent, converts missing history into an obstacle.

#### Scenario: A tenancy signed before these terms existed

- **WHEN** an owner opens a lease created before this change
- **THEN** each unrecorded term is reported as absent rather than as a default value

#### Scenario: A meter that genuinely read zero

- **WHEN** a lease records an opening water reading of zero
- **THEN** it is reported as zero, distinguishably from a lease with no reading recorded

#### Scenario: Correcting one term without supplying the others

- **WHEN** an owner corrects the rent of a lease that has no notice period recorded
- **THEN** the correction is accepted, and the notice period stays absent
