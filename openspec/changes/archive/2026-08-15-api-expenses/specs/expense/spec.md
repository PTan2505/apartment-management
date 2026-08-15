## Purpose

Records what the owner pays on a property — cleaning, repairs, and other costs entered by hand, plus the electricity a room consumes while it stands empty, which no tenant can be charged for.

## ADDED Requirements

### Requirement: Owner can record an expense
The system SHALL allow an authenticated `owner` to record an expense against a building, optionally against a specific room within it, with a category, an amount, a description, and the date it was incurred. The amount MUST be greater than zero. Where a room is named, it MUST belong to the named building.

#### Scenario: Recording a building-level expense
- **WHEN** an authenticated owner records an expense against a building with a category, amount, and date
- **THEN** the system creates the expense and responds with HTTP 201

#### Scenario: Recording a room-level expense
- **WHEN** an authenticated owner records an expense naming both a building and one of its rooms
- **THEN** the system creates the expense associated with that room

#### Scenario: Room belongs to a different building
- **WHEN** an authenticated owner records an expense naming a room that is not in the named building
- **THEN** the system responds with HTTP 400 and creates no expense

#### Scenario: Building or room does not exist
- **WHEN** an authenticated owner records an expense naming a building or room id that does not exist
- **THEN** the system responds with HTTP 404 and creates no expense

#### Scenario: Amount of zero or below
- **WHEN** an authenticated owner records an expense with an amount of zero or a negative amount
- **THEN** the system responds with HTTP 400 and creates no expense

### Requirement: An expense amount may be derived from a quantity and rate
The system SHALL allow an expense to record the quantity and unit rate it was calculated from, for costs that are measured rather than flat. Where both are supplied, the amount SHALL be computed from them and rounded to whole units rather than accepted from the caller, so the recorded amount can never disagree with the figures it claims to come from. Where they are absent, the amount SHALL be supplied directly.

#### Scenario: Amount computed from quantity and rate
- **WHEN** an authenticated owner records an expense supplying a quantity and a unit rate
- **THEN** the amount is their product rounded to whole units, and the quantity and rate are retained on the record

#### Scenario: Flat amount without quantity
- **WHEN** an authenticated owner records an expense supplying only an amount
- **THEN** the expense records that amount with no quantity or unit rate

#### Scenario: Supplied amount is ignored when a quantity and rate are given
- **WHEN** an authenticated owner supplies a quantity, a unit rate, and an amount that does not match their product
- **THEN** the system records the computed amount rather than the supplied one

### Requirement: Vacant room electricity is charged to the owner at month end
The system SHALL allow an authenticated `owner` to record the electricity a room consumed while vacant, by supplying the meter reading taken at the end of a month during which the room had no tenancy at that month's end. The system SHALL charge the increase over the room's last known meter reading at the building's electricity rate, and SHALL record both readings so consecutive vacant months chain from one to the next. Where the meter has not advanced, no expense SHALL be created.

#### Scenario: Recording a vacant month
- **WHEN** an authenticated owner records a month-end meter reading for a room that was vacant at that month's end, higher than the room's last known reading
- **THEN** the system creates a vacancy electricity expense for the difference at the building's electricity rate, dated the last day of that month

#### Scenario: Meter has not moved
- **WHEN** an authenticated owner records a month-end reading equal to the room's last known reading
- **THEN** the system creates no expense and reports that there was nothing to charge

#### Scenario: Consecutive vacant months chain
- **WHEN** an authenticated owner records a vacant month-end reading for a room that already has a vacancy expense from the previous month
- **THEN** the new expense's opening reading is the previous vacancy expense's closing reading

#### Scenario: First vacant month after a tenancy ends
- **WHEN** an authenticated owner records the first vacant month-end reading for a room whose previous lease has recorded a closing reading
- **THEN** the expense's opening reading is that lease's closing reading

#### Scenario: Reading below the last known reading
- **WHEN** an authenticated owner records a month-end reading lower than the room's last known reading
- **THEN** the system responds with HTTP 400 and creates no expense

#### Scenario: Room was occupied at that month's end
- **WHEN** an authenticated owner records a vacancy reading for a room that had an active lease at the end of that month
- **THEN** the system responds with HTTP 400, because that month's consumption belongs on the tenant's invoice

#### Scenario: A room may be both invoiced and expensed for one month
- **WHEN** a lease ended partway through a month and the room stood empty for the rest of it
- **THEN** the room may hold both an invoice covering the occupied days and a vacancy expense covering the remainder

#### Scenario: The same vacant month recorded twice
- **WHEN** an authenticated owner records a vacancy reading for a room and month that already has one
- **THEN** the system responds with HTTP 409 and the existing expense is unchanged

### Requirement: Remaining vacancy consumption is charged when a new lease begins
The system SHALL charge the owner for any increase between a room's last known meter reading and the opening reading of a newly created lease, recording it as a vacancy electricity expense dated the lease's start date. This catches consumption from a month end the owner did not record, and from a vacancy too short to have met one. Where the opening reading is not higher than the last known reading, no expense SHALL be created.

#### Scenario: Lease opens above the last known reading
- **WHEN** an authenticated owner creates a lease whose opening meter reading exceeds the room's last known reading
- **THEN** the system records a vacancy electricity expense for the difference, dated the lease's start date

#### Scenario: Lease opens at the last known reading
- **WHEN** an authenticated owner creates a lease whose opening meter reading equals the room's last known reading
- **THEN** no vacancy expense is created

#### Scenario: Lease opens below the last known reading
- **WHEN** an authenticated owner creates a lease whose opening meter reading is lower than the room's last known reading, because the meter was replaced
- **THEN** no vacancy expense is created, because a replaced meter is a new baseline rather than a credit

#### Scenario: The lease and its expense are recorded together
- **WHEN** recording the vacancy expense fails while creating a lease
- **THEN** neither the lease nor the expense is created, so a lease can never exist having silently lost its vacancy cost

#### Scenario: A short vacancy that met no month end
- **WHEN** a room stands empty for a few days between two tenancies, never reaching a month end, and the new lease opens above the previous lease's closing reading
- **THEN** the difference is still charged to the owner

#### Scenario: Two turnovers within one month
- **WHEN** a room changes hands twice in the same month, each time leaving a gap between the previous closing reading and the new lease's opening reading
- **THEN** both gaps are charged as separate vacancy expenses, because a room may be re-let more than once in a month and each vacancy is its own reconciliation

### Requirement: System-generated expenses are marked and remain correctable
The system SHALL record whether an expense was created by the system or entered by the owner, and SHALL allow an owner to update or delete either kind. Deleting an expense SHALL remove it outright rather than marking it inactive.

#### Scenario: Generated expense is marked as such
- **WHEN** the system creates a vacancy electricity expense
- **THEN** that expense records that the system created it, distinguishing it from one the owner entered

#### Scenario: Correcting a generated expense
- **WHEN** an authenticated owner updates a system-generated expense
- **THEN** the change is saved, because a mistyped meter reading must be correctable after the fact

#### Scenario: Deleting an expense
- **WHEN** an authenticated owner deletes an expense
- **THEN** the expense is removed and no longer appears in any listing or total

#### Scenario: Deleting an expense that does not exist
- **WHEN** an authenticated owner deletes an expense id that does not exist
- **THEN** the system responds with HTTP 404

### Requirement: Owner can list, filter, and retrieve expenses
The system SHALL allow an authenticated `owner` to retrieve an expense by id and to list expenses filtered by building, room, category, and the date range they were incurred in. Listing SHALL use the shared paginated response contract.

#### Scenario: Filtering by building
- **WHEN** an authenticated owner lists expenses filtered by a building id
- **THEN** the response contains only expenses recorded against that building, including those attached to its rooms

#### Scenario: Filtering by category
- **WHEN** an authenticated owner lists expenses filtered by a category
- **THEN** the response contains only expenses of that category

#### Scenario: Filtering by date range
- **WHEN** an authenticated owner lists expenses incurred between two dates
- **THEN** the response contains only expenses whose incurred date falls within that range

#### Scenario: Retrieving an expense that does not exist
- **WHEN** an authenticated owner requests an expense id that does not exist
- **THEN** the system responds with HTTP 404

#### Scenario: Expense listing is paginated
- **WHEN** an authenticated owner lists expenses
- **THEN** the response is the shared paginated shape, with the expenses in `data` and the page, page size, and totals in `meta`

### Requirement: Expense endpoints require an authenticated owner
The system SHALL reject any expense request that is unauthenticated or made by a user whose role is not `owner`.

#### Scenario: Unauthenticated request
- **WHEN** a request to any expense endpoint has no valid access token
- **THEN** the system responds with HTTP 401 and does not process the request

#### Scenario: Authenticated non-owner request
- **WHEN** a request to any expense endpoint carries a valid access token for a user whose role is not `owner`
- **THEN** the system responds with HTTP 403 and does not process the request
