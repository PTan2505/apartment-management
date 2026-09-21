## REMOVED Requirements

### Requirement: Departing the responsible occupant offers the transfer it requires

**Reason**: It required that departing the LAST occupant be accepted, "leaving a tenancy that reports no tenant until a move-out is recorded". That state is the thing being removed — a running tenancy, billed and holding a deposit, with nobody recorded as living in it — so the scenario asserting it cannot stand beside a requirement that refuses it.

**Migration**: None for stored data. The screen stops offering the action for a single occupant; the operation that ends a tenancy is unchanged and is what that owner wanted. Replaced by "Departing an occupant hands over responsibility with it" below, which keeps transferring-on-its-own and the transfer-while-departing behaviour.

## ADDED Requirements

### Requirement: Departing an occupant hands over responsibility with it

Where the person leaving is the one responsible for the agreement and other occupants remain, the screen SHALL ask which of them takes over, and SHALL send the handover together with the departure as one operation.

The screen already knows who the others are. Reporting a refusal and stopping would be a screen that knows exactly what to do and declines to do it. Sending two requests would be worse than either: the handover can land while the departure fails, leaving the agreement in somebody else's name with the previous holder still living there.

The choices offered SHALL be the current occupants other than the person leaving.

The screen SHALL NOT offer to record a departure for the ONLY current occupant. There is nobody to hand the agreement to and nothing the departure could mean except ending the tenancy, which has its own action — so the screen SHALL point at that action rather than offering one that will be refused.

#### Scenario: Handing over while recording a departure

- **WHEN** the owner records the departure of the responsible occupant and chooses who takes over
- **THEN** that person becomes responsible and the departure is recorded

#### Scenario: The choices are the people who remain

- **WHEN** the owner is asked who takes over
- **THEN** the current occupants other than the person leaving are offered, and nobody else

#### Scenario: Departing somebody who is not responsible

- **WHEN** the owner records the departure of an occupant who is not the one responsible
- **THEN** no handover is asked for

#### Scenario: The only occupant is not offered the action

- **WHEN** the owner opens a tenancy with exactly one current occupant
- **THEN** no departure action is offered for that person, and the screen says that ending the tenancy is what applies

#### Scenario: Transferring on its own

- **WHEN** the owner transfers responsibility to another current occupant without recording a departure
- **THEN** that person becomes responsible, the previous one remains an occupant, and both are still listed

#### Scenario: A refusal is reported

- **WHEN** the API refuses a departure
- **THEN** the reason it gave is shown and the occupant list is unchanged
