## ADDED Requirements

### Requirement: The system reports which tenancies are due to be billed for a month

The system SHALL report, for a given month, every tenancy that can be issued a monthly invoice for it and has not been, together with the electricity reading each would open from.

A caller cannot work this out cheaply, and should not have to work it out at all. Answering it means taking the tenancies that occupied the room during that month, subtracting those already holding a non-voided invoice for it, excluding those with no rent left to charge within their term, and then resolving one opening reading per tenancy — which in a client is a request per room and a second copy of a rule this system already owns. Two copies of a billing rule is one that will eventually disagree with the invoices it produced.

Its purpose is answering **"which rooms have I not billed yet"**, so what it reports SHALL be exactly the work outstanding: a tenancy SHALL leave the result as soon as its invoice for that month exists, and SHALL NOT appear where issuing one would be refused.

The opening reading SHALL be the same figure the invoice would actually open from — the closing reading of that tenancy's most recent metered non-voided invoice, or the reading the tenancy itself started from where it has none. A figure that merely resembles it would let a caller present a plausible wrong number for a person to check their typing against.

The result SHALL identify each tenancy's room and building, so it can be read without a further request per row, and SHALL be narrowable by building — an owner closing off a month works through one building at a time.

#### Scenario: What is outstanding for a month

- **WHEN** an authenticated owner asks what is due to be billed for a month
- **THEN** the system reports every tenancy that occupied a room in that month and has no non-voided invoice for it, each with its room, its building, and the reading it would open from

#### Scenario: An already billed tenancy is not reported

- **WHEN** a tenancy holds a non-voided monthly invoice for that month
- **THEN** it is not reported as due

#### Scenario: A voided invoice leaves the work outstanding

- **WHEN** a tenancy's only invoice for that month has been voided
- **THEN** it is reported as due again, because the bill it had was withdrawn

#### Scenario: A tenancy with no rent left in its term

- **WHEN** a tenancy occupied the month but its term reaches no further, so that its remaining utilities belong on a final invoice
- **THEN** it is not reported as due, because issuing a monthly invoice for it would be refused

#### Scenario: A tenancy that did not occupy the month

- **WHEN** a tenancy began after that month ended, or ended before it began
- **THEN** it is not reported as due

#### Scenario: A cancelled tenancy is never due

- **WHEN** a tenancy has been cancelled
- **THEN** it is not reported as due for any month, because it occupied none

#### Scenario: The opening reading matches what the invoice would use

- **WHEN** a tenancy has already been billed for earlier months
- **THEN** the reading reported is the closing reading of its most recent metered non-voided invoice

#### Scenario: A tenancy that has never been metered

- **WHEN** a tenancy has no invoice carrying a meter reading
- **THEN** the reading reported is the one the tenancy itself started from

#### Scenario: Narrowed to one building

- **WHEN** an authenticated owner asks what is due for a month within a named building
- **THEN** only tenancies in that building are reported

#### Scenario: Nothing outstanding

- **WHEN** every tenancy that occupied that month has been billed for it
- **THEN** the system reports that nothing is due, rather than an error

#### Scenario: Requires an authenticated owner

- **WHEN** an unauthenticated request asks what is due to be billed
- **THEN** the system responds with HTTP 401
