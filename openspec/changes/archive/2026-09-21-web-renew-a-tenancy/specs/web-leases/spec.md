## ADDED Requirements

### Requirement: The owner can renew a tenancy from its screen

The application SHALL offer, on a running tenancy, an action that renews it: closing it on its agreed end date and opening a successor beginning that day, in one operation.

Without it the owner reaches the same outcome by recording a move-out and signing a new tenancy — which re-enters the occupants by hand, settles the deposit and collects it again, re-chooses the service fees, leaves the days between the two uncovered, and records no link between the agreements. A renewal is one operation in the API and SHALL be one action on the screen.

The application SHALL ask only for what a renewal genuinely needs: the closing meter reading and the length of the new term. Everything the successor inherits — its start date, its occupants, its deposit, its service fees — SHALL be shown rather than asked for again.

The agreed rent SHALL be offered with the ROOM's current rent filled in, and SHALL be changeable. A renewal is where a price rise takes effect; carrying the old rent forward silently would make a rise unenforceable for as long as a tenant keeps renewing.

Where the deposit the successor requires differs from what is already held, the application SHALL say so before the renewal is confirmed, and SHALL let the owner either charge the difference on the successor's first invoice or leave it to be settled in cash.

The application SHALL state, before the owner confirms, that the predecessor will be closed with a final bill for its last month and the successor opened with its move-in bill. These are invoices the owner will be answering for, and meeting them afterwards is meeting them too late.

The action SHALL NOT be offered on a tenancy that has recorded a move-out or been cancelled. Its tenancy is closed, and its successor, if any, exists already.

On success the application SHALL take the owner to the successor.

#### Scenario: Renewing a running tenancy

- **WHEN** the owner renews a tenancy, supplying the closing meter reading and a term
- **THEN** the predecessor is closed on its agreed end date, a successor begins that day, and the owner is taken to the successor

#### Scenario: What the successor inherits is shown, not asked

- **WHEN** the owner opens the renewal dialog
- **THEN** the start date, the occupants carried over, and the service fees at their current prices are shown without being asked for

#### Scenario: The rent comes from the room and can be changed

- **WHEN** the owner opens the renewal dialog for a room whose rent has since risen
- **THEN** the room's current rent is filled in, and the owner can change it before confirming

#### Scenario: A deposit that no longer matches

- **WHEN** the renewal requires a larger deposit than is held
- **THEN** the dialog says so and offers to charge the difference on the successor's first invoice or to settle it in cash

#### Scenario: The bills are named before confirming

- **WHEN** the owner is about to confirm a renewal
- **THEN** the dialog says the predecessor's final bill and the successor's move-in bill will be issued

#### Scenario: Not offered where it cannot apply

- **WHEN** the owner opens a tenancy that has recorded a move-out or been cancelled
- **THEN** no renewal action is offered

#### Scenario: A refusal is reported

- **WHEN** the API refuses a renewal
- **THEN** the reason it gave is shown in the dialog, the dialog stays open, and neither tenancy is changed
