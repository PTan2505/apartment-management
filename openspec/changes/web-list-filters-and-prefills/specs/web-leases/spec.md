## ADDED Requirements

### Requirement: The closing and renewal readings are prefilled

The meter reading asked for when recording a move-out, and when renewing, SHALL be
prefilled with the reading this tenancy's invoices have already reached.

It was previously left blank, on the grounds that this is the one figure on the form
nobody can check afterwards and a prefilled number gets accepted without anybody walking
out to the meter. The owner weighed that against every other field being prefilled and
chose consistency.

The floor SHALL still be enforced: a reading below what has already been invoiced is
refused before the request, with the figure named.

#### Scenario: Recording a move-out

- **WHEN** the owner opens the move-out form for a tenancy that has been invoiced
- **THEN** the closing reading is already filled with the reading those invoices reached

#### Scenario: Renewing

- **WHEN** the owner opens the renewal form
- **THEN** the closing reading is already filled the same way

#### Scenario: Typing below the floor

- **WHEN** the owner replaces the prefilled reading with a lower one
- **THEN** the form says it is below what has been invoiced and does not submit

#### Scenario: A tenancy with nothing invoiced yet

- **WHEN** no invoice has established a reading for the tenancy
- **THEN** the field falls back to the room's last known reading, or stays blank when there is none
