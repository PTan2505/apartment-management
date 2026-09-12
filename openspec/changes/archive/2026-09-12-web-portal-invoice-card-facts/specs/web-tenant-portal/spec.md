## ADDED Requirements

### Requirement: A bill names the place it is for

The application SHALL show, on each bill, the building the room is in, alongside the room.

Room codes repeat across buildings. A tenant renting in more than one place sees two bills whose codes alone cannot tell them apart, and the building is the only thing on the record that can.

#### Scenario: Reading which place a bill is for

- **WHEN** the tenant reads a bill in the list
- **THEN** the building is named beside the room

### Requirement: A settled bill says when it was settled

The application SHALL show, for a bill that has been settled, the day the money arrived.

"Đã trả" alone answers whether, not when, and when is the question a tenant opens the portal with after making a transfer. Without it, telling this month's settled bill from last month's means opening each one.

Where a settled bill carries no date, the application SHALL say it is settled and SHALL NOT substitute another date. The API reports null deliberately — a bill written off, or settled against a deposit before dates were recorded — and the issue date or today would put a day in front of the tenant that nothing in the system supports.

A bill that has not been settled SHALL NOT show a settled date.

#### Scenario: A bill settled on a known day

- **WHEN** the tenant reads a bill that was paid and whose payment carries a date
- **THEN** that day is shown with the settled state

#### Scenario: A bill settled with no date recorded

- **WHEN** a settled bill has no payment date
- **THEN** it still reads as settled, and no day is shown

#### Scenario: An unpaid bill

- **WHEN** the tenant reads a bill that is not settled
- **THEN** no settled date appears
