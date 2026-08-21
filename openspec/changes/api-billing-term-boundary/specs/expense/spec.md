## MODIFIED Requirements

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
