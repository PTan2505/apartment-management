## ADDED Requirements

### Requirement: A tenancy shows what was handed over

A tenancy's page SHALL show its hand-over record: each item, its make, its value, and the
condition it was handed over in, with the date.

It SHALL be presented as a frozen record rather than as a live list — this is what the
tenant received, not what the room currently holds — because the two diverge and a reader
who confuses them will check the wrong list at move-out.

A tenancy whose record is empty SHALL say the room was handed over unfurnished.

Nothing on this page SHALL offer to change a hand-over entry.

Once the tenancy has been closed, the page SHALL show each item's return condition beside
its hand-over condition, and SHALL mark the ones that came back worse.

#### Scenario: Reading the record

- **WHEN** the owner opens a tenancy of a furnished room
- **THEN** each item is listed with its value and hand-over condition, dated

#### Scenario: The room has changed since

- **WHEN** the room has gained an item since the tenancy began
- **THEN** the tenancy's record does not show it, and the page makes clear it is a record of that day

#### Scenario: An unfurnished hand-over

- **WHEN** the tenancy's record is empty
- **THEN** the page says the room was handed over unfurnished

#### Scenario: After closing

- **WHEN** a closed tenancy is opened
- **THEN** each item shows both conditions, and anything worse is marked

### Requirement: Closing a tenancy checks the furniture in, and offers to charge for damage

The move-out form SHALL list the hand-over record and let each item be given a condition
at return, from the same fixed set.

It SHALL state that this is optional and that leaving items unchecked records them as
unchecked rather than as returned in good order. A form that quietly treats "I did not
look" as "it is fine" is worse than one that records nothing.

Where items come back worse than they were handed over, the application SHALL offer to
raise an ad-hoc invoice for them, with the amount prefilled from the values on the
hand-over record and the items named in its description.

It SHALL be an OFFER, not an automatic charge, and SHALL be refusable: wear the owner
decides to absorb is the common case, and a charge raised without a decision would be
found later by the tenant rather than by the owner.

The form SHALL NOT offer to deduct from the deposit. Money kept back is charged on an
invoice; the deposit then settles against it, as it already does.

#### Scenario: Checking in

- **WHEN** the owner records a move-out and marks each item's condition
- **THEN** the tenancy records both conditions for every item

#### Scenario: Damage found

- **WHEN** an item handed over in good condition is marked damaged
- **THEN** the form offers an ad-hoc invoice with that item named and its hand-over value filled in

#### Scenario: Declining to charge

- **WHEN** the owner declines the offer
- **THEN** the move-out is recorded, the conditions are kept, and no invoice is issued

#### Scenario: Skipping the check

- **WHEN** the owner records a move-out without marking anything
- **THEN** it succeeds, the items are recorded as unchecked, and no charge is offered

#### Scenario: Nothing is taken from the deposit

- **WHEN** damage is charged
- **THEN** it is charged on an invoice, and the deposit settles against that invoice rather than being reduced directly

#### Scenario: An unfurnished tenancy

- **WHEN** a tenancy with an empty hand-over record is closed
- **THEN** the form shows no check-in section at all
