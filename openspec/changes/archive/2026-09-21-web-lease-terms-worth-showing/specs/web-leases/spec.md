## REMOVED Requirements

### Requirement: The terms that can be recorded can be entered from the screen that reports them missing

**Reason**: It required the notice period, the payment day and the opening water reading to be enterable. All three have been removed from the system, so a field for any of them would write to a column that no longer exists.

**Migration**: None. Replaced by "The signing date can be entered where it is reported missing" below, which keeps the reference rule and adds the signing date to the form where a tenancy is signed.

## MODIFIED Requirements

### Requirement: The agreed terms of a tenancy are readable on it

The application SHALL show, on a tenancy, the terms the agreement was made on: its reference, and the date the paper contract was signed.

These are the answers an owner is asked for by a tenant or needs in a dispute, and the tenancy is the only record that holds them.

The notice period, the payment day and the opening water reading SHALL NOT be shown, because the system no longer holds them. Each was written and read by nothing: no move-out consulted the notice, no invoice carried a due date from the payment day, and water is billed per occupant rather than by meter. The water reading was the costliest of the three to show — beside an electricity reading that every invoice consumes, a second meter-looking number reads as another billed meter, and someone would eventually reconcile a water bill against a figure nothing had ever added.

Where the signing date has not been recorded, the screen SHALL say so rather than leave the space blank. A blank is read as a screen that failed rather than as a fact about the tenancy.

Each row of terms SHALL be laid out across the width of the card rather than bunched at one edge, so one fact is separated from the next.

#### Scenario: Reading the terms

- **WHEN** the owner opens a tenancy whose terms have been recorded
- **THEN** the reference and the signing date are shown

#### Scenario: A term that was never recorded

- **WHEN** a tenancy has no signing date
- **THEN** the screen says it has not been recorded, rather than showing an empty space

#### Scenario: The retired terms are nowhere on the screen

- **WHEN** the owner opens any tenancy
- **THEN** no notice period, payment day or opening water reading appears on it

#### Scenario: A tenancy that was renewed

- **WHEN** the owner opens a tenancy created by renewing another
- **THEN** its reference is shown like any other tenancy's, not as an empty space

## ADDED Requirements

### Requirement: The signing date can be entered where it is reported missing

The application SHALL let the owner supply the date the paper contract was signed, both when a tenancy is signed and afterwards when correcting its terms.

Asking at signing is the point: that is the moment the owner has the paper in front of them, and a field that can only be filled in later is filled in never. It SHALL be optional in both places — a tenancy recorded from an old paper file may have no date anyone remembers.

The reference SHALL NOT be editable. It is generated and never accepted from a caller: a typed reference drifts, and two tenancies sharing one makes both unfindable.

#### Scenario: The signing date is asked for at signing

- **WHEN** the owner signs a new tenancy and enters the date the paper contract was signed
- **THEN** the tenancy records it and shows it

#### Scenario: Signing without the paper date

- **WHEN** the owner signs a tenancy without entering that date
- **THEN** the tenancy is created and the date is reported as not recorded

#### Scenario: Recording it afterwards

- **WHEN** the owner enters the signing date on a tenancy that had none
- **THEN** it is saved and the tenancy shows it

#### Scenario: The reference is not offered for editing

- **WHEN** the owner edits the terms of a tenancy
- **THEN** the reference is not among the fields they can change

### Requirement: A tenancy shows where it came from and what it became

Where a tenancy was created by renewing another, the screen SHALL say so and SHALL name the earlier agreement. Where a tenancy has been renewed, it SHALL name the one that followed it.

Each SHALL be a link to that tenancy, and SHALL be named by the agreement's reference rather than by its record id. "Gia hạn từ #266" sends the reader away to find out what #266 was; the reference is what they recognise.

Unlike the other terms, an absent link SHALL NOT be reported at all. A tenancy that was signed rather than renewed is not missing a predecessor, and a row saying it has not been recorded would send the owner looking for one that never existed.

#### Scenario: Reading a renewed tenancy

- **WHEN** the owner opens a tenancy created by renewing another
- **THEN** it names the earlier agreement, and following that name opens it

#### Scenario: Reading the tenancy that was renewed

- **WHEN** the owner opens a tenancy that has since been renewed
- **THEN** it names the agreement that followed it, and following that name opens it

#### Scenario: A tenancy with no renewal on either side

- **WHEN** the owner opens a tenancy that was signed and has not been renewed
- **THEN** neither link appears, and nothing says a link has not been recorded
