## Purpose

Records what the owner pays on a property — cleaning, repairs, and other costs entered by hand, plus the electricity a room consumes while it stands empty, which no tenant can be charged for.

## Requirements

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

Whether a tenancy covered the month's last day SHALL follow the same exclusive reading of an ending date as everything else: a tenancy whose move-out is recorded on the last day of the month did **not** cover that day, and the room was therefore vacant at month end.

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
- **WHEN** an authenticated owner records a vacancy reading for a room whose lease covered the last day of that month
- **THEN** the system responds with HTTP 400, because that month's consumption belongs on the tenant's invoice

#### Scenario: A tenancy ending on the month's last day leaves it vacant
- **WHEN** an authenticated owner records a vacancy reading for a room whose lease recorded a move-out dated the last day of that month
- **THEN** the system accepts it, because that date is the first day the tenancy no longer covers and the room was empty for it

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

### Requirement: The system reports which rooms need their vacancy electricity recorded for a month

The system SHALL report, for a given month, every room that stood empty at that month's end and has no vacancy electricity recorded for it, together with the meter reading each would open from.

This is a cost the owner does not know is missing. Rent and utilities announce themselves — a tenant is billed, or is not — but a room standing empty runs its meter quietly and produces a cost nobody thought to look for. Nothing in the system asks about it, so it is simply never recorded, and every revenue report is too flattering by that amount.

Working it out is not something a caller can do cheaply: it means finding the rooms no tenancy covered at that month's end, subtracting those already recorded for it, and resolving one meter reading per room. Assembled by a client that is a request per room and a second copy of a rule this module already owns — the same rule that refuses to record a vacancy for a month a tenancy covered.

What is reported SHALL be exactly the work outstanding: a room SHALL leave the result as soon as its vacancy is recorded for that month, and SHALL NOT appear where recording one would be refused.

**Occupancy SHALL be judged at the month's end, not across the month.** A room let mid-month was occupied when the month closed, and its whole month of consumption belongs on the tenant's invoice — the system already refuses a vacancy record in that case, and reporting the room as outstanding would offer work that cannot be done.

The opening reading SHALL be the same figure the recorded cost would be computed from. A figure that merely resembles it would let a caller present a plausible wrong number for a person to check their typing against.

**A room with no known reading at all SHALL NOT be reported.** Consumption is a difference, and a room never let and never recorded has nothing to subtract from — the system already refuses to record a vacancy for it. Its first reading is taken when it is first let, which is a different operation on a different screen.

The result SHALL identify each room and its building, and SHALL be narrowable by building.

Retired rooms SHALL be excluded. A room taken out of service is not one the owner is waiting to let, and its meter is not their running cost.

#### Scenario: What is outstanding for a month

- **WHEN** an authenticated owner asks which rooms need their vacancy electricity recorded for a month
- **THEN** the system reports every active room that no tenancy covered at that month's end and that has no vacancy record for it, each with its building and the reading it would open from

#### Scenario: A room already recorded is not reported

- **WHEN** a room already has a month-end vacancy record for that month
- **THEN** it is not reported as outstanding

#### Scenario: A room a tenancy covered at the month's end

- **WHEN** a room was let on the last day of that month
- **THEN** it is not reported, because that month's consumption belongs on the tenant's invoice

#### Scenario: A room let partway through the month

- **WHEN** a tenancy began mid-month and was still running at the month's end
- **THEN** the room is not reported, because recording a vacancy for it would be refused

#### Scenario: A room whose tenancy ended before the month closed

- **WHEN** a tenancy recorded a move-out before that month's last day
- **THEN** the room is reported, because it stood empty when the month closed

#### Scenario: A retired room

- **WHEN** a room has been retired
- **THEN** it is not reported, because it is not a room the owner is waiting to let

#### Scenario: The opening reading matches what the cost would use

- **WHEN** a room's most recent known reading comes from a previous tenancy's closing reading or an earlier vacancy record
- **THEN** that is the reading reported

#### Scenario: A room with no reading at all

- **WHEN** a room has never been let and has no vacancy recorded
- **THEN** it is not reported, because there is no baseline to measure consumption against and recording one would be refused

#### Scenario: Narrowed to one building

- **WHEN** an authenticated owner asks what is outstanding within a named building
- **THEN** only rooms in that building are reported

#### Scenario: Nothing outstanding

- **WHEN** every empty room has been recorded for that month
- **THEN** the system reports that nothing is outstanding, rather than an error

#### Scenario: Requires an authenticated owner

- **WHEN** an unauthenticated request asks what is outstanding
- **THEN** the system responds with HTTP 401
