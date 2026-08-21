## ADDED Requirements

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
