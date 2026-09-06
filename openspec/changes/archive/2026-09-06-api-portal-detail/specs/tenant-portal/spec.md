## ADDED Requirements

### Requirement: The portal says where a bill is from

The portal SHALL report, for each bill, the building the room belongs to.

A person may hold tenancies in two buildings, and a room code alone does not say which — P202 is a plausible room code in any of them. A tenant reading a bill needs to know which place it is about before any of its figures mean anything.

The building SHALL be reported by the name a tenant would recognise, not by an identifier. The portal's shape deliberately withholds how the system is organised — lease ids, room ids, the deposit, anything about the owner's finances — and a building's name is not that: it is where the person lives.

#### Scenario: A bill says where it is from

- **WHEN** a tenant reads a bill in the portal
- **THEN** the building its room belongs to is reported with it, by name

#### Scenario: Two buildings

- **WHEN** a tenant holds tenancies in two buildings and has bills for both
- **THEN** each bill reports its own building

#### Scenario: Still not how the system is organised

- **WHEN** a tenant reads any bill
- **THEN** no lease id, room id or building id is reported with it

### Requirement: A settled bill says when it was settled

The portal SHALL report, for a bill that has been paid, the date it was settled.

A tenant who paid last week and returns to check needs to see that the payment landed and when. "Paid" alone tells them the system agrees with them; it does not tell them the system agrees about the payment they are thinking of, which is the question somebody asks after a transfer they are unsure of.

The date SHALL be the date of the payment that settled the bill, read from the payments recorded against it rather than stored again beside the bill. A second copy is a second thing to disagree with the payments beneath it.

Where a bill is settled but no payment carries a date, the portal SHALL report the settlement date as absent rather than substituting the issue date or today.

#### Scenario: A settled bill

- **WHEN** a tenant reads a bill that has been paid
- **THEN** the date it was settled is reported with it

#### Scenario: An unpaid bill

- **WHEN** a tenant reads a bill that has not been paid
- **THEN** no settlement date is reported

#### Scenario: Settled with no date recorded

- **WHEN** a bill is settled but the payment that settled it carries no date
- **THEN** the settlement date is reported as absent rather than guessed
