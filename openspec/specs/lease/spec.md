## Purpose

Tracks rental agreements that bind people to a room for an agreed period, recording who signed the lease, who lives under it over time, how many occupants utilities are billed for, and when the tenant actually moved out.

## Requirements

### Requirement: Owner can create a lease
The system SHALL allow an authenticated `owner` to create a lease for an existing active room, naming an existing customer as the lease signatory and recording a start date, an agreed duration in whole months, an occupant count, the electricity meter reading the tenancy starts from, the agreed monthly rent, and the deposit expressed in months of rent. Duration and occupant count MUST both be at least 1. Creating the lease SHALL also record the signatory as the lease's primary occupant, and SHALL issue the lease's move-in invoice charging its deposit and its first month's rent. All three SHALL be created together, so a lease never exists without someone responsible for it or without the bill that starts it. The starting meter reading SHALL default to the room's latest known meter reading — the most recent of its previous lease's closing reading and any vacancy reading recorded since — and MAY be overridden by the owner, so that electricity consumed while the room stood empty is not charged to the incoming tenant. Where the room has no previous lease, the reading MUST be supplied.

The agreed rent SHALL default to the room's base rent at the moment the lease is created, and MAY be overridden, so that rent negotiated with a particular tenant can be recorded without changing what the room asks of everyone else. It MUST NOT be negative.

The deposit SHALL be recorded as a whole number of months of the agreed rent, because that is how it is agreed. It MUST be supplied and MUST NOT be negative. Zero SHALL be accepted, for a lease taken without a deposit — an agreement with no deposit and an agreement whose deposit was never recorded SHALL NOT be indistinguishable.

#### Scenario: Successful creation
- **WHEN** an authenticated owner creates a lease for an active, unoccupied room naming an existing customer as signatory, with a valid start date, duration, occupant count, starting meter reading, and deposit
- **THEN** the system creates the lease as active, records the signatory as its primary occupant, issues its move-in invoice, and responds with HTTP 201 and the created lease

#### Scenario: Creating a lease issues its opening bill
- **WHEN** an authenticated owner creates a lease
- **THEN** a move-in invoice exists for it, charging the deposit agreed and the rent for the month the tenancy begins

#### Scenario: A lease is not left without its opening bill
- **WHEN** issuing the move-in invoice fails while a lease is being created
- **THEN** no lease, occupant record or invoice is created

#### Scenario: Agreed rent defaults to the room's rent
- **WHEN** an authenticated owner creates a lease without supplying an agreed rent
- **THEN** the lease records the room's base rent as it stood at that moment

#### Scenario: Owner negotiates a different rent
- **WHEN** an authenticated owner creates a lease supplying an agreed rent different from the room's base rent
- **THEN** the lease records the supplied rent, and the room's base rent is unchanged

#### Scenario: Negative agreed rent
- **WHEN** an authenticated owner supplies a negative agreed rent
- **THEN** the system responds with HTTP 400 and does not create the lease

#### Scenario: Deposit recorded in months
- **WHEN** an authenticated owner creates a lease with a deposit of two months
- **THEN** the lease records a deposit of two months

#### Scenario: A lease taken without a deposit
- **WHEN** an authenticated owner creates a lease with a deposit of zero months
- **THEN** the system creates the lease and records the deposit as zero

#### Scenario: Missing deposit
- **WHEN** an authenticated owner creates a lease without supplying a deposit
- **THEN** the system responds with HTTP 400 and does not create the lease

#### Scenario: Negative deposit
- **WHEN** an authenticated owner supplies a negative number of deposit months
- **THEN** the system responds with HTTP 400 and does not create the lease

#### Scenario: Starting reading defaults to the previous tenancy's closing reading
- **WHEN** an authenticated owner creates a lease for a room whose previous lease recorded a closing meter reading, without supplying a starting reading
- **THEN** the lease starts from that closing reading

#### Scenario: Owner overrides the starting reading after a vacancy
- **WHEN** an authenticated owner creates a lease supplying a starting meter reading higher than the previous lease's closing reading, because the meter advanced while the room was empty
- **THEN** the system records the supplied reading, so the incoming tenant is not charged for consumption from the vacant period

#### Scenario: Room has no previous lease
- **WHEN** an authenticated owner creates the first lease for a room without supplying a starting meter reading
- **THEN** the system responds with HTTP 400, because there is no previous reading to fall back on and assuming zero would charge the tenant for the meter's whole history

#### Scenario: Meter was replaced between tenancies
- **WHEN** an authenticated owner creates a lease supplying a starting meter reading lower than the previous lease's closing reading, because the meter was replaced
- **THEN** the system records the supplied reading as the new baseline

#### Scenario: Negative starting meter reading
- **WHEN** an authenticated owner supplies a negative starting meter reading
- **THEN** the system responds with HTTP 400 and does not create the lease

#### Scenario: Signatory does not exist
- **WHEN** an authenticated owner creates a lease naming a customer id that does not exist
- **THEN** the system responds with HTTP 404 and creates neither the lease nor an occupant record

#### Scenario: Room does not exist
- **WHEN** an authenticated owner creates a lease referencing a room id that does not exist
- **THEN** the system responds with HTTP 404 and does not create the lease

#### Scenario: Room is retired
- **WHEN** an authenticated owner creates a lease for a room that has been retired
- **THEN** the system responds with HTTP 400 and does not create the lease

#### Scenario: Invalid duration or occupant count
- **WHEN** an authenticated owner submits a duration or occupant count below 1
- **THEN** the system responds with HTTP 400 and does not create the lease

#### Scenario: Signatory has no phone number
- **WHEN** an authenticated owner creates a lease naming a customer who has no phone number recorded
- **THEN** the system responds with HTTP 400, because the person responsible for the agreement must be contactable

#### Scenario: Default follows a vacancy reading recorded after the previous tenancy
- **WHEN** an authenticated owner creates a lease for a room whose vacancy electricity was recorded after its previous lease ended, without supplying a starting reading
- **THEN** the lease starts from the most recent vacancy reading rather than the previous lease's closing reading, because the owner has already paid for the consumption in between

### Requirement: A room has at most one active lease
The system SHALL reject a new lease for a room that already has an active lease. Once the existing lease records a move-out **or is cancelled**, the room SHALL accept a new lease, and the previous lease SHALL be retained as history.

The system SHALL further reject a new lease whose start date falls before the most recent tenancy on that room ended, so that no day is covered by two leases at once. Because an ending date is the first day no longer covered, a new lease MAY begin on exactly the date the previous one ended, and no earlier — the two then meet with neither a gap nor an overlap.

**A cancelled lease SHALL be excluded from that comparison entirely.** It covered no days, so there is nothing for a new tenancy to overlap; treating its dates as occupied would block a room the cancellation was performed to free.

A start date later than the previous tenancy's end SHALL be accepted. A room may stand empty between tenancies, and the days in between belong to nobody rather than being an error.

No other constraint SHALL be placed on the start date. A tenancy may begin on any day of any month; only overlapping a previous tenancy is refused.

#### Scenario: Room already has an active lease
- **WHEN** an authenticated owner creates a lease for a room whose existing lease has no move-out date and has not been cancelled
- **THEN** the system responds with HTTP 409 and does not create the lease

#### Scenario: Re-letting a room after a cancellation

- **WHEN** an authenticated owner creates a lease for a room whose only other lease was cancelled
- **THEN** the system creates it, whatever its start date

#### Scenario: Re-letting a room after move-out
- **WHEN** an authenticated owner creates a lease for a room whose previous lease has recorded a move-out, starting on or after that date
- **THEN** the system creates the new lease successfully and the previous lease remains unchanged as history

#### Scenario: A new lease beginning on the date the previous one ended
- **WHEN** an authenticated owner creates a lease starting on exactly the date the room's previous lease recorded as its move-out
- **THEN** the system creates it, because that date is the first day the previous tenancy no longer covers

#### Scenario: A new lease overlapping the previous tenancy
- **WHEN** an authenticated owner creates a lease for a room, starting before the date the previous lease recorded as its move-out
- **THEN** the system responds with HTTP 409 and does not create the lease, because both tenancies would be billed for the same days

#### Scenario: A gap between tenancies is allowed
- **WHEN** an authenticated owner creates a lease starting well after the room's previous lease ended
- **THEN** the system creates it, because a room may stand empty between tenancies

#### Scenario: A tenancy may begin on any day of the month
- **WHEN** an authenticated owner creates a lease starting partway through a month, not overlapping any previous tenancy on that room
- **THEN** the system creates it

#### Scenario: The check considers the room's most recent tenancy
- **WHEN** a room has been let several times and an authenticated owner creates a lease starting before the latest of those ended
- **THEN** the system responds with HTTP 409, even where the start date falls after some earlier tenancy ended

#### Scenario: A room's first lease has nothing to overlap
- **WHEN** an authenticated owner creates the first lease a room has ever had
- **THEN** the system creates it whatever its start date

#### Scenario: Room accumulates lease history
- **WHEN** an authenticated owner lists the leases for a room that has been let several times
- **THEN** the response includes every past lease along with the current one

### Requirement: Owner can manage the occupants of a lease
The system SHALL allow an authenticated `owner` to add a person as an occupant of a lease, to record the date an occupant left, and to list a lease's occupants including those who have departed. Each occupant record SHALL carry the date the person joined and, once they leave, the date they departed. Listing occupants SHALL be paginated using the shared paginated response contract.

#### Scenario: Adding an occupant
- **WHEN** an authenticated owner adds an existing customer as an occupant of an active lease
- **THEN** the system records the occupant with a joined date and responds with HTTP 201

#### Scenario: Recording that an occupant left
- **WHEN** an authenticated owner records a departure date for a current occupant
- **THEN** the occupant is reported as departed and remains listed in the lease's occupant history

#### Scenario: Listing occupants includes those who left
- **WHEN** an authenticated owner lists the occupants of a lease that some people have since left
- **THEN** the response includes both current and departed occupants, each with their joined and departure dates

#### Scenario: Adding a person who does not exist
- **WHEN** an authenticated owner adds an occupant referencing a customer id that does not exist
- **THEN** the system responds with HTTP 404

#### Scenario: Adding the same person twice
- **WHEN** an authenticated owner adds a person who is already a current occupant of that lease
- **THEN** the system responds with HTTP 409 and does not create a second record

#### Scenario: Re-adding a person who previously left
- **WHEN** an authenticated owner adds a person who was an occupant of that lease but has since departed
- **THEN** the system creates a new occupant record and the earlier departed record is retained

#### Scenario: Departure date before the joined date
- **WHEN** an authenticated owner records a departure date earlier than the date that occupant joined
- **THEN** the system responds with HTTP 400 and the occupant remains current

#### Scenario: Following a person between rooms
- **WHEN** a person is recorded as departed from one lease and added as an occupant of another lease
- **THEN** both records refer to the same customer, so the owner can see where that person lived and when

#### Scenario: Occupant listing is paginated
- **WHEN** an authenticated owner lists the occupants of a lease
- **THEN** the response is the shared paginated shape, with the occupants in `data` and the page, page size, and totals in `meta`
### Requirement: A lease has one primary occupant at a time
The system SHALL treat exactly one current occupant as the lease's primary occupant — the person responsible for the agreement — and SHALL allow that responsibility to be transferred to another current occupant without losing the record of who held it before.

#### Scenario: The signatory is the primary occupant
- **WHEN** an authenticated owner retrieves the occupants of a newly created lease
- **THEN** the person named as signatory is marked as the primary occupant

#### Scenario: Transferring responsibility to another occupant
- **WHEN** an authenticated owner transfers primary responsibility to another current occupant of the lease
- **THEN** that person becomes the primary occupant, the previous primary remains a current occupant, and the record of who was previously primary is retained

#### Scenario: Transferring to someone who is not an occupant
- **WHEN** an authenticated owner transfers primary responsibility to a person who is not a current occupant of that lease
- **THEN** the system responds with HTTP 400 and the primary occupant is unchanged

#### Scenario: Removing the primary occupant
- **WHEN** an authenticated owner records a departure date for the occupant who is currently primary, while other occupants remain
- **THEN** the system responds with HTTP 409, because responsibility must be transferred to another occupant first

#### Scenario: The primary occupant is the last one to leave
- **WHEN** an authenticated owner records a departure date for the primary occupant and no other current occupants remain
- **THEN** the system accepts the departure, because there is nobody to transfer responsibility to, and the lease reports no tenant until a move-out is recorded

### Requirement: Occupant count is maintained separately from occupant records
The system SHALL treat the lease's occupant count as a manually maintained number that is authoritative for utility billing, and SHALL NOT derive it from the recorded occupants. An owner may know how many people live in a room while holding details for only some of them, so the two figures MAY differ and the system SHALL NOT reconcile them automatically.

#### Scenario: Occupant count differs from recorded occupants
- **WHEN** a lease has an occupant count of 5 but only 2 people recorded as occupants
- **THEN** the system accepts both values and reports the occupant count as 5

#### Scenario: Adding an occupant does not change the occupant count
- **WHEN** an authenticated owner adds a person as an occupant of a lease
- **THEN** the lease's occupant count is unchanged

#### Scenario: Recording a departure does not change the occupant count
- **WHEN** an authenticated owner records a departure date for an occupant
- **THEN** the lease's occupant count is unchanged

### Requirement: Lease status, expected end date, and tenant are derived
The system SHALL derive a lease's expected end date from its start date and agreed duration, its status from whether it has been cancelled or has recorded a move-out, its tenant from the current primary occupant, and its deposit amount from the agreed rent and the number of deposit months. None of these SHALL be independently settable, so they can never contradict the records they come from.

**A lease's status SHALL distinguish three states: running, finalized, and cancelled.** A tenancy that never took place is not one that ran and ended, and reporting them alike would present as history something that never happened — inflating how many tenancies a room has had, and how many a person has held.

A date that ends a tenancy SHALL be **exclusive**: it is the first day the tenancy no longer covers, and the last day covered is the day before it. This SHALL hold for both the expected end date and the move-out date, so that a reader never has to remember which of them counts its own day and which does not.

A lease beginning 1 January for six months therefore has an expected end date of 1 July and covers through 30 June. A lease whose move-out is recorded as 5 July covers through 4 July. In both cases a new lease beginning on that same date follows with neither a gap nor an overlap.

The expected end date SHALL NOT constrain the move-out date. It states when the agreement ends, not when the tenant left — a tenant may stay past it without either party wanting a renewal, and the record SHALL be able to say so.

**A cancelled lease's dates describe an agreement, not an occupancy.** Its expected end date SHALL continue to be reported, because it states what was agreed, but nothing SHALL present it as days the tenancy covered.

The deposit amount SHALL be reported alongside the number of months it was agreed in, so that a caller can show either without computing it. It SHALL follow the lease's own agreed rent rather than the room's current rent, because the deposit was agreed against the rent in the lease.

#### Scenario: Expected end date reflects start date and duration
- **WHEN** an authenticated owner retrieves a lease starting 2026-01-15 with an agreed duration of 12 months
- **THEN** the response reports an expected end date of 2027-01-15

#### Scenario: The expected end date is the first day not covered
- **WHEN** a lease begins 2026-01-01 with an agreed duration of six months
- **THEN** its expected end date is 2026-07-01 and the last day it covers is 2026-06-30

#### Scenario: A renewal begins where the previous term ended
- **WHEN** a lease's expected end date is 2026-07-01 and a new lease for the same room begins on that date
- **THEN** the two tenancies neither overlap nor leave a day uncovered

#### Scenario: A move-out date is the first day not covered
- **WHEN** a lease records a move-out dated 2026-07-05
- **THEN** the last day it covers is 2026-07-04

#### Scenario: A renewal begins on the date the previous tenancy ended
- **WHEN** a lease records a move-out dated 2026-07-05 and a new lease for the same room begins on 2026-07-05
- **THEN** the two tenancies neither overlap nor leave a day uncovered

#### Scenario: A tenant who left after the term is recorded as they left
- **WHEN** an authenticated owner records a move-out dated after the lease's expected end date, because the tenant stayed on and neither party wanted a renewal
- **THEN** the system accepts it and records that date, rather than requiring a date that did not happen

#### Scenario: Lease without a move-out date is active
- **WHEN** an authenticated owner retrieves a lease that has no move-out date and has not been cancelled
- **THEN** the response reports the lease as active

#### Scenario: Lease with a move-out date is finalized
- **WHEN** an authenticated owner retrieves a lease that has a move-out date
- **THEN** the response reports the lease as finalized

#### Scenario: A cancelled lease reports itself as cancelled

- **WHEN** an authenticated owner retrieves a lease that has been cancelled
- **THEN** the response reports it as cancelled, distinct from both active and finalized

#### Scenario: Expected end date follows an updated duration
- **WHEN** an authenticated owner changes a lease's agreed duration
- **THEN** the expected end date reported for that lease changes accordingly

#### Scenario: Reported tenant follows a transfer of responsibility
- **WHEN** primary responsibility for a lease is transferred to another occupant
- **THEN** the lease reports that person as its tenant

#### Scenario: Deposit amount is derived from the agreed rent
- **WHEN** an authenticated owner retrieves a lease with an agreed rent of 3,000,000 and a deposit of two months
- **THEN** the response reports a deposit amount of 6,000,000

#### Scenario: A zero-month deposit reports a zero amount
- **WHEN** an authenticated owner retrieves a lease whose deposit is zero months
- **THEN** the response reports a deposit amount of zero

#### Scenario: Deposit amount ignores a later change to the room's rent
- **WHEN** a room's base rent is changed after a lease on it was created
- **THEN** that lease still reports a deposit amount derived from its own agreed rent

### Requirement: Owner can record a move-out
The system SHALL allow an authenticated `owner` to record the date a tenant actually moved out together with the electricity meter reading taken at handover, which finalizes the lease and frees the room for a new one. The move-out date MUST NOT precede the lease start date. The closing meter reading MUST NOT be lower than the lease's starting reading, nor lower than the closing reading of that lease's most recent invoice. Finalizing a lease SHALL also mark its current occupants as departed on that date, so nobody is left recorded as living in a room that is no longer let, and SHALL issue the lease's final invoice charging the utilities of that month up to the departure. Where the departure falls after the lease's expected end date, an overdue invoice SHALL be issued alongside it, carrying charges the owner names for the days beyond the term. All of it SHALL be recorded together, so a tenancy is never closed without its closing bill. The closing reading SHALL both close the outgoing tenancy's electricity and provide the default starting point for the room's next lease.

#### Scenario: Recording a move-out
- **WHEN** an authenticated owner records a move-out date and closing meter reading on an active lease
- **THEN** the lease is reported as finalized, the closing reading is retained, its final invoice is issued, and the room becomes available for a new lease

#### Scenario: A late departure also issues an overdue bill
- **WHEN** an authenticated owner records a move-out dated after the lease's expected end date, naming charges for the extra days
- **THEN** both a final invoice for the days within the term and an overdue invoice carrying those charges are issued

#### Scenario: A tenancy is not closed without its closing bill
- **WHEN** issuing the final invoice fails while a move-out is being recorded
- **THEN** the move-out is not recorded and the lease remains active

#### Scenario: Move-out closes the occupancy records
- **WHEN** an authenticated owner records a move-out date on a lease that has current occupants
- **THEN** those occupants are recorded as having departed on that date

#### Scenario: Closing reading below the lease's starting reading
- **WHEN** an authenticated owner records a closing meter reading lower than the reading the lease started from
- **THEN** the system responds with HTTP 400 and the lease remains active

#### Scenario: Closing reading below an already invoiced reading
- **WHEN** an authenticated owner records a closing meter reading lower than the closing reading of that lease's most recent invoice
- **THEN** the system responds with HTTP 400, because the tenancy has already been billed past that point

#### Scenario: Move-out before the start date
- **WHEN** an authenticated owner records a move-out date earlier than the lease's start date
- **THEN** the system responds with HTTP 400 and the lease remains active

#### Scenario: Move-out on an already finalized lease
- **WHEN** an authenticated owner records a move-out on a lease that already has a move-out date
- **THEN** the system responds with HTTP 409 and the original move-out date is unchanged

#### Scenario: Move-out may precede the expected end date
- **WHEN** an authenticated owner records a move-out date earlier than the lease's expected end date
- **THEN** the system accepts it and finalizes the lease, because tenants may leave before their agreed term ends

### Requirement: Owner can list, filter, and retrieve leases

The system SHALL allow an authenticated `owner` to retrieve a lease by id and to list leases filtered by room, **by building**, by the people who have occupied them, by whether they are active, and by whether their agreed term has run out without a move-out being recorded.

Filtering by building exists because a room code identifies a room only within its building, so an owner holding several buildings cannot pick a room without first knowing which building it is in. Naming the rooms of a building one at a time is not a substitute: it is the caller reconstructing a grouping the system already holds. Listing SHALL be paginated using the shared paginated response contract, so the response carries a `data` array and a `meta` object describing the page and totals rather than a bare array.

**Leases SHALL be listed most recently begun first.** The tenancy an owner has just signed, or is about to act on, is the recent one; ordering oldest-first puts it on the last page and makes the common case the hardest to reach. Where two leases begin on the same day, the more recently recorded SHALL come first, so the order is total and a lease cannot move between pages.

A lease whose term has ended while no move-out is recorded SHALL be findable, because it needs attention: no further invoice can be issued for it, and its room stays held against a new tenancy until it is closed or renewed. Leaving such a lease discoverable only by inspecting each room in turn would make a state the system creates a state the owner cannot act on.

This filter SHALL be combinable with the others, and SHALL be judged against the same exclusive reading of the term as billing uses.

#### Scenario: Leases are listed most recently begun first

- **WHEN** an authenticated owner lists leases
- **THEN** the lease with the most recent start date appears first

#### Scenario: Leases beginning on the same day have a stable order

- **WHEN** two leases share a start date
- **THEN** the more recently recorded appears first, and neither moves between pages as the list is paged through

#### Scenario: Filtering to active leases
- **WHEN** an authenticated owner lists leases filtered to active ones
- **THEN** the response contains only leases with no move-out date

#### Scenario: Filtering to leases whose term has run out
- **WHEN** an authenticated owner lists leases filtered to those whose term has ended without a move-out
- **THEN** the response contains only leases with no move-out date whose agreed term has already ended

#### Scenario: A lease still within its term is not listed as overdue
- **WHEN** an authenticated owner filters to overdue leases and a lease with no move-out is still inside its agreed term
- **THEN** that lease is not included

#### Scenario: A closed lease is not listed as overdue
- **WHEN** an authenticated owner filters to overdue leases and a lease whose term ended has since recorded a move-out
- **THEN** that lease is not included, because it needs no attention

#### Scenario: The overdue filter combines with the others
- **WHEN** an authenticated owner filters to overdue leases within a particular room
- **THEN** the response contains only that room's leases matching both conditions

#### Scenario: Filtering by building

- **WHEN** an authenticated owner lists leases filtered by a building id
- **THEN** the response contains every lease for a room in that building, and none for a room elsewhere

#### Scenario: Building and room together

- **WHEN** an authenticated owner filters by both a building and a room in it
- **THEN** the response contains that room's leases

#### Scenario: Filtering by person
- **WHEN** an authenticated owner lists leases filtered by a customer id
- **THEN** the response contains every lease that person has occupied, whether as primary occupant or not, including finalized ones

#### Scenario: Retrieving a lease that does not exist
- **WHEN** an authenticated owner requests a lease id that does not exist
- **THEN** the system responds with HTTP 404

#### Scenario: Lease listing is paginated
- **WHEN** an authenticated owner lists leases
- **THEN** the response is the shared paginated shape, with the leases in `data` and the page, page size, and totals in `meta`

#### Scenario: Paging applies to filtered leases
- **WHEN** an authenticated owner lists leases filtered to active ones and asks for a specific page
- **THEN** the items and totals describe only the active leases

### Requirement: Owner can update lease terms
The system SHALL allow an authenticated `owner` to update an active lease's occupant count and agreed duration. Changing the occupant count SHALL NOT alter any invoice already issued, because each invoice records the count it billed.

#### Scenario: Updating the occupant count
- **WHEN** an authenticated owner updates the occupant count on an active lease
- **THEN** the system saves the change and responds with HTTP 200 and the updated lease

#### Scenario: Updating a finalized lease
- **WHEN** an authenticated owner updates a lease that has already recorded a move-out
- **THEN** the system responds with HTTP 409 and does not apply the change

#### Scenario: Occupant count below one
- **WHEN** an authenticated owner updates a lease's occupant count to less than 1
- **THEN** the system responds with HTTP 400 and does not apply the change

### Requirement: Lease endpoints require an authenticated owner
The system SHALL reject any lease or lease-occupant request that is unauthenticated or made by a user whose role is not `owner`.

#### Scenario: Unauthenticated request
- **WHEN** a request to any lease endpoint has no valid access token
- **THEN** the system responds with HTTP 401 and does not process the request

#### Scenario: Authenticated non-owner request
- **WHEN** a request to any lease endpoint carries a valid access token for a user whose role is not `owner`
- **THEN** the system responds with HTTP 403 and does not process the request
### Requirement: Owner can extend a lease

The system SHALL allow an authenticated `owner` to extend a lease: closing it on its agreed end date and opening a successor beginning that same day, in one operation.

The two SHALL be written together. A tenancy closed without its successor leaves a room recorded as empty while somebody lives in it, and a successor opened without its predecessor closing collides with the rule of one active lease per room.

The successor SHALL inherit, by default:

- its **start date** from the predecessor's expected end date, so the tenancies neither overlap nor leave a day uncovered;
- its **starting meter reading** from the closing reading supplied;
- its **occupants**, including which of them is primary, so the same people continue without being re-entered;
- its **kinds of service fee**, priced at the building's **current** amounts. A renewal is where a price rise takes effect; carrying the old prices forward would make a rise unenforceable for as long as a tenant keeps renewing.

Its **agreed rent** SHALL default to the room's current base rent and MAY be given, its **duration** SHALL be given, and its **deposit months** and **occupant count** SHALL default to the predecessor's and MAY be given.

Closing the predecessor SHALL behave exactly as recording a move-out on its expected end date does: its occupancy records close, and its final invoice is issued for the utilities of the month it ended in. The closing meter reading SHALL be supplied, because the electricity of that last month has to be billed and the successor has to start from somewhere — the tenant not having left changes neither.

**A late extension SHALL be normalised to the on-time case.** Where the extension is recorded after the agreed end date has passed, the predecessor SHALL still close on its agreed end date and the successor SHALL still begin there. **No overdue invoice SHALL be issued.** The parties renewed, so those days were never days beyond an agreement — they are the successor's first days, and the successor bills them.

A lease that has already recorded a move-out SHALL NOT be extendable. Its tenancy is closed and its successor, if any, exists already.

#### Scenario: Extending a lease

- **WHEN** an authenticated owner extends a lease running 2026-01-01 to 2026-04-01 for a further six months
- **THEN** the predecessor records a move-out dated 2026-04-01, and a successor lease runs from 2026-04-01 to 2026-10-01

#### Scenario: The tenancies meet exactly

- **WHEN** a lease is extended
- **THEN** the predecessor covers through the day before the successor's start date, with neither a gap nor an overlap

#### Scenario: The occupants continue

- **WHEN** a lease with three occupants, one of them primary, is extended
- **THEN** the successor carries the same three occupants with the same one primary, without them being supplied

#### Scenario: Service fees are carried at current prices

- **WHEN** a lease carrying a parking fee of 100,000 is extended, and the building's parking fee is now 150,000
- **THEN** the successor carries a parking fee of 150,000

#### Scenario: The owner overrides the inherited rent

- **WHEN** an authenticated owner extends a lease supplying an agreed rent
- **THEN** the successor is created with that rent rather than the room's current base rent

#### Scenario: The predecessor is billed for its last month

- **WHEN** a lease is extended with a closing meter reading
- **THEN** the predecessor's final invoice is issued for the utilities of the month it ended in, charging no rent

#### Scenario: The successor opens with its own bill

- **WHEN** a lease is extended
- **THEN** the successor's move-in invoice is issued, charging the first month's rent

#### Scenario: The successor starts from the closing reading

- **WHEN** a lease is extended with a closing meter reading of 4,820
- **THEN** the successor's starting meter reading is 4,820

#### Scenario: A late extension still closes on the agreed end date

- **WHEN** an authenticated owner extends on 2026-04-09 a lease whose agreed end date was 2026-04-01
- **THEN** the predecessor records a move-out dated 2026-04-01 and the successor begins 2026-04-01

#### Scenario: A late extension issues no overdue invoice

- **WHEN** a lease is extended after its agreed end date has passed
- **THEN** no overdue invoice is issued, because the days beyond the term belong to the successor

#### Scenario: Extending a finalized lease

- **WHEN** an authenticated owner extends a lease that has already recorded a move-out
- **THEN** the system responds with HTTP 409 and no successor is created

#### Scenario: A failed extension leaves the tenancy running

- **WHEN** any part of an extension fails
- **THEN** neither lease is changed or created and no invoice is issued, so the original tenancy is left running rather than closed without a successor

#### Scenario: Extension requires an authenticated owner

- **WHEN** a lease is extended without an access token whose role is `owner`
- **THEN** the system responds with HTTP 401 or 403 and nothing is created

### Requirement: A lease reports the room it is for

Every lease the system returns SHALL report its room — the room's id, its code, and the building that room belongs to, identified by id and display name — and SHALL do so identically whether the lease is listed or retrieved on its own.

A lease reporting only a room id cannot be shown. A room code identifies a room only within its building, so a code without its building is ambiguous; and an id without either is not something a reader can act on. Without this, listing twenty tenancies means twenty further requests, or fetching every room and joining them by hand — which is wrong the moment there are more rooms than fit in one page.

The reported room SHALL be limited to what identifies it. Its rent, its status, and whether it is let SHALL NOT be included: those belong to the room's own representation, and a lease's own agreed rent is a different figure that must not be confused with the room's.

#### Scenario: A retrieved lease reports its room

- **WHEN** an authenticated owner retrieves a lease
- **THEN** the response carries the room's id and code, and the building that room belongs to, identified by id and display name

#### Scenario: A listed lease reports its room

- **WHEN** an authenticated owner lists leases
- **THEN** each carries its room in the same form as when retrieved singly

#### Scenario: The room's own figures are not included

- **WHEN** an authenticated owner retrieves a lease
- **THEN** the reported room does not carry the room's rent, its status, or whether it is let

#### Scenario: The lease's rent is its own

- **WHEN** a room's base rent is changed after a lease on it was created
- **THEN** the lease still reports its own agreed rent, and the room reported alongside carries no rent to disagree with it

### Requirement: A finished tenancy still reports who was responsible for it

A lease that has recorded a move-out SHALL report the person who was responsible for it when it ended, even though that person is no longer a current occupant.

Recording a move-out departs every occupant, so a finished tenancy has nobody currently responsible — and reporting the tenant as absent erases the one name the record exists to hold. The question asked of a closed tenancy, months later, is who was renting the room; a record that cannot answer it has lost its point.

**A tenancy that is still running SHALL NOT fall back in this way.** There, no current responsible occupant means the last one left before a move-out was recorded and nobody is answerable for the agreement right now. That is a real state needing attention, and naming somebody who has left would conceal it.

#### Scenario: A finished tenancy names who held it

- **WHEN** an authenticated owner retrieves a lease whose move-out has been recorded
- **THEN** the response reports the person who was responsible for it when it ended

#### Scenario: Responsibility transferred before the end

- **WHEN** responsibility was transferred during a tenancy that has since ended
- **THEN** the person reported is the one who held it at the end, not the one who held it first

#### Scenario: A running tenancy with nobody responsible reports nobody

- **WHEN** an authenticated owner retrieves a running lease whose responsible occupant has departed and which has no move-out recorded
- **THEN** the response reports no tenant, rather than the person who left

### Requirement: A lease reports the date its tenancy ended

A lease that has recorded a move-out SHALL report that date, alongside the status derived from it. A lease still running SHALL report no such date.

The system already holds this and already treats it as significant: it is deliberately not constrained by the agreed term, precisely so that a tenant who stayed on can be recorded as they actually left. But the date reaches no caller — only a status saying the tenancy is over, which cannot say when, and cannot distinguish a tenancy that ran its term from one closed early or late. The record was able to say so and was not asked.

The date SHALL be exclusive in the same way as the expected end date: the first day the tenancy no longer covers. Reporting one of the two dates on each convention would guarantee that somebody eventually reads them the same way.

#### Scenario: A finished tenancy reports when it ended

- **WHEN** an authenticated owner retrieves a lease whose move-out was recorded as 2026-07-05
- **THEN** the response reports that date, and reports the lease as finalized

#### Scenario: A running tenancy reports no ending

- **WHEN** an authenticated owner retrieves a lease with no move-out recorded
- **THEN** the response reports no move-out date, and reports the lease as active

#### Scenario: A tenancy that ran past its term is distinguishable

- **WHEN** an authenticated owner retrieves a lease whose move-out was recorded after its expected end date
- **THEN** both dates are reported, so what was agreed and what happened can be told apart


### Requirement: Owner can cancel a lease that was never lived in

The system SHALL allow an authenticated `owner` to cancel a lease, recording that the tenancy never took place rather than that it ended.

This is a different event from a move-out and SHALL NOT be expressible as one. A move-out closes a tenancy that happened: it takes a closing meter reading, bills a final month, and prorates the days occupied. A cancellation has none of those to take — nobody occupied a day — and the system already refuses to pretend otherwise, rejecting a move-out dated before the start and rejecting one dated on it for covering no days. Without a cancellation those refusals leave the lease with no way out at all: its room held, its move-in invoice outstanding, and nothing correctable.

**Cancellation SHALL be permitted only while no monthly invoice has been issued against the lease.** A monthly invoice is the point past which a tenancy has demonstrably been lived in and billed for, and unwinding it is a different and larger problem. The system SHALL refuse in those terms, naming the move-out as what is wanted instead.

The start date SHALL NOT restrict it. A tenant who promised to arrive and never did leaves a lease whose start date has passed and which was never occupied, and that is precisely the case this exists for.

A lease already cancelled, or one that has recorded a move-out, SHALL NOT be cancellable.

The date of the cancellation SHALL be recorded. When the owner gave up on a tenancy is a fact about the room's history, and without it a cancelled lease cannot be placed in time at all.

#### Scenario: Cancelling a tenancy that never started

- **WHEN** an authenticated owner cancels a lease whose start date has not arrived and which has been billed no monthly invoice
- **THEN** the system records it as cancelled, together with the date

#### Scenario: Cancelling after the start date has passed

- **WHEN** an authenticated owner cancels a lease whose start date has passed but which has been billed no monthly invoice
- **THEN** the system records it as cancelled, because the start date says when a tenancy was due to begin and not that it did

#### Scenario: A tenancy that has been billed cannot be cancelled

- **WHEN** an authenticated owner cancels a lease that has been issued a monthly invoice
- **THEN** the system refuses, and says that a tenancy which has been billed is ended by recording a move-out

#### Scenario: A tenancy that has already ended cannot be cancelled

- **WHEN** an authenticated owner cancels a lease that has recorded a move-out
- **THEN** the system refuses

#### Scenario: Cancelling twice

- **WHEN** an authenticated owner cancels a lease that is already cancelled
- **THEN** the system refuses and nothing changes

### Requirement: A lease reports whether it can be cancelled

The system SHALL report, on every lease it returns, whether that tenancy can be cancelled, and whether it has been billed for a month.

The rule behind cancellation lives in the service that enforces it. A caller deciding whether to offer the action would otherwise have to restate that rule — fetch the tenancy's invoices, look for a monthly one, and combine it with the status — which is the same rule written a second time and free to drift from the first. Offering an action the system refuses is the visible half of that drift; withholding one it would have allowed is the half nobody reports.

Both facts SHALL be reported, not just the verdict. A caller that withholds the action needs to say why, and "it has been billed" is the reason an owner can act on.

This SHALL cost no additional request per lease. It is a fact about the tenancy, and a listing of twenty must not become twenty-one requests to report it.

#### Scenario: A cancellable tenancy says so

- **WHEN** an authenticated owner retrieves a running lease that has been billed no monthly invoice
- **THEN** the response reports it as cancellable, and as not having been billed for a month

#### Scenario: A billed tenancy says why it is not

- **WHEN** an authenticated owner retrieves a running lease that has been issued a monthly invoice
- **THEN** the response reports it as not cancellable, and as having been billed for a month

#### Scenario: A tenancy that is over is not cancellable

- **WHEN** an authenticated owner retrieves a lease that has recorded a move-out, or one already cancelled
- **THEN** the response reports it as not cancellable

#### Scenario: Reported across a listing

- **WHEN** an authenticated owner lists leases
- **THEN** every lease in the page carries both facts, without a request per lease

### Requirement: Cancelling frees the room immediately

A cancelled lease SHALL NOT hold its room. The room SHALL report itself as available, SHALL appear among rooms that can be let, and SHALL accept a new lease starting on any date.

Freeing the room is most of the point. A tenancy that never happened occupies no days, so it constrains no future tenancy's start date — unlike a tenancy that ended, whose dates a successor must not overlap.

#### Scenario: The room is available again

- **WHEN** a lease on a room is cancelled
- **THEN** the room reports itself as not let, and appears among rooms with no running tenancy

#### Scenario: The room accepts a new tenancy

- **WHEN** an authenticated owner creates a lease for a room whose only other lease was cancelled
- **THEN** the system creates it

#### Scenario: A cancelled tenancy constrains no start date

- **WHEN** an authenticated owner creates a lease starting before the cancelled lease's own start date
- **THEN** the system creates it, because a tenancy that never happened covered no days for a new one to overlap

#### Scenario: A cancelled tenancy remains in the room's history

- **WHEN** an authenticated owner lists the leases for a room whose lease was cancelled
- **THEN** the cancelled lease is included, marked as cancelled

### Requirement: A tenancy can carry its signed contract

The system SHALL allow an authenticated `owner` to attach one signed contract file to a tenancy, to replace it, to remove it, and to retrieve it.

The record cannot otherwise settle an argument. When a tenant says the rent was different or that no deposit was agreed, every figure here is one party's assertion; the signed page is the only thing that is not.

The file SHALL be evidence attached to the record and nothing more. No rule SHALL read it, and no reported value SHALL derive from it — a tenancy with no contract SHALL behave in every other way exactly like one that has it.

Replacing a contract SHALL leave the tenancy with exactly one, and SHALL NOT leave the previous file behind in storage. Storage nobody can reach from the application is storage nobody will ever clear.

#### Scenario: Attaching a contract

- **WHEN** an authenticated owner attaches a contract to a tenancy
- **THEN** the tenancy reports that it has one

#### Scenario: Replacing a contract

- **WHEN** an authenticated owner attaches a contract to a tenancy that already has one
- **THEN** the tenancy carries the new one and the previous file is removed from storage

#### Scenario: Removing a contract

- **WHEN** an authenticated owner removes a tenancy's contract
- **THEN** the tenancy reports that it has none, and the file is removed from storage

#### Scenario: A tenancy without one behaves normally

- **WHEN** a tenancy has no contract attached
- **THEN** every other operation on it behaves exactly as it does today

### Requirement: Contract bytes do not pass through the API

The system SHALL issue a short-lived signed URL that uploads the file directly to storage, and SHALL NOT accept the file's bytes itself.

A scan of a contract is megabytes uploaded from a phone. Passing it through this process would hold a request open for the length of that upload, on a server whose whole job is answering questions about small records — and the process has nothing to do with the bytes.

**A signed upload URL SHALL permit writing exactly one object**, under the prefix belonging to that tenancy. A URL obtained for one tenancy SHALL NOT be usable to write anywhere else, because the caller chooses none of the destination.

The URL SHALL expire in minutes rather than hours. It authorises a write to the owner's storage, and its useful life is the length of one upload.

The permitted content type SHALL be fixed when the URL is signed, so that a URL obtained for a document cannot be used to store something else.

#### Scenario: Obtaining an upload URL

- **WHEN** an authenticated owner asks to upload a contract for a tenancy
- **THEN** the system responds with a signed URL, the key it will write, and when the URL expires

#### Scenario: The destination is not the caller's to choose

- **WHEN** an authenticated owner obtains an upload URL
- **THEN** the object it may write is under that tenancy's own prefix, whatever the caller asked for

#### Scenario: An expired URL

- **WHEN** an upload is attempted with a URL past its expiry
- **THEN** storage refuses it

#### Scenario: Storage is not configured

- **WHEN** an authenticated owner asks to upload a contract while storage is unconfigured
- **THEN** the system says so, and every other part of the system continues to work

### Requirement: An upload is confirmed before it is recorded

The system SHALL record a tenancy's contract only after confirming the object exists in storage, and SHALL check its size and content type at that point.

A signed URL is handed out before anything is uploaded, and the upload can fail after it — the browser can be closed, the connection dropped, the file rejected. Recording the contract when the URL is issued would leave tenancies claiming a contract that is not there, and nothing would ever notice.

**A file exceeding the permitted size SHALL be refused and removed from storage.** A size cannot be enforced by a signed PUT the way a content type can, so it is enforced where it can be — after the fact, before anything is recorded — and the rejected object is not left behind.

#### Scenario: Confirming an upload

- **WHEN** an authenticated owner confirms an upload that reached storage
- **THEN** the tenancy records the contract

#### Scenario: Confirming an upload that never arrived

- **WHEN** an authenticated owner confirms an upload for an object that is not in storage
- **THEN** the system refuses and the tenancy records nothing

#### Scenario: A file that is too large

- **WHEN** the uploaded object exceeds the permitted size
- **THEN** the system refuses it, removes it from storage, and the tenancy records nothing

#### Scenario: Confirming against another tenancy's object

- **WHEN** a confirmation names a key outside that tenancy's prefix
- **THEN** the system refuses

### Requirement: A contract is read back by a short-lived link

The system SHALL return a short-lived signed URL for reading a tenancy's contract, and the stored file SHALL NOT be publicly readable.

A contract carries names, an address, a signature and a phone number. A permanent link is one forwarded message away from being public, and a link that expires limits the damage of forwarding it to the minutes after it was sent.

#### Scenario: Reading a contract

- **WHEN** an authenticated owner asks for a tenancy's contract
- **THEN** the system responds with a signed URL that expires

#### Scenario: A tenancy with no contract

- **WHEN** an authenticated owner asks for a contract on a tenancy that has none
- **THEN** the system responds with HTTP 404

#### Scenario: The file is not public

- **WHEN** the stored object is requested without a signed URL
- **THEN** storage refuses it

### Requirement: Contract endpoints require an authenticated owner

Every contract operation SHALL require an authenticated `owner`.

#### Scenario: Unauthenticated

- **WHEN** an unauthenticated request asks for an upload URL, confirms an upload, reads a contract, or removes one
- **THEN** the system responds with HTTP 401

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
