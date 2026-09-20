## ADDED Requirements

### Requirement: An action that cannot be taken back is confirmed before it is sent

The application SHALL obtain a deliberate confirmation before sending any request whose effect the owner cannot undo from the same screen, and SHALL send nothing until that confirmation is given.

An action SHALL be treated as requiring confirmation when it:

- moves or reverses money that has been recorded
- deletes a stored file or image
- overwrites a stored file or image, because the one it replaces is deleted
- changes whether something is in service
- changes a recorded price, rate or amount that later billing or reporting reads

An action SHALL NOT require confirmation merely because it writes: creating a record, recording a reading, and editing details that carry no money are ordinary work, and a confirmation on each would train the owner to dismiss them without reading.

A confirmation SHALL state what will happen in the owner's own terms, naming the thing acted on and any consequence that is not visible on the screen behind it — an amount, a file name, an invoice returning to unpaid. It SHALL NOT merely ask whether the owner is sure.

Where the action changes recorded figures, the confirmation SHALL show each changed figure as its old value and its new one, and SHALL list only the figures that actually changed.

Declining SHALL leave everything as it was, including any form the owner was filling in, so that declining costs nothing but a click.

While the request is in flight the confirmation SHALL say so and SHALL NOT accept a second confirmation, so one action is never sent twice.

A failure SHALL be reported where the owner is looking — on the screen or in the form they came from — and SHALL NOT dismiss that screen as though the action had succeeded.

#### Scenario: Nothing is sent before the owner confirms

- **WHEN** the owner starts an action that cannot be taken back and does not confirm
- **THEN** no request is sent and nothing changes

#### Scenario: The confirmation says what will happen

- **WHEN** the owner is asked to confirm an action
- **THEN** the question names the thing being acted on and the consequence, rather than only asking whether they are sure

#### Scenario: Changed figures are shown old and new

- **WHEN** the owner saves a form in which recorded figures changed
- **THEN** the confirmation lists each changed figure with its previous and its new value, and omits the figures that did not change

#### Scenario: Declining leaves the work in place

- **WHEN** the owner declines a confirmation raised from a form they were filling in
- **THEN** the form is still open with everything they had entered

#### Scenario: One action is sent once

- **WHEN** the owner confirms and the request is in flight
- **THEN** the confirmation reports that it is working and a second confirmation is not accepted

#### Scenario: Ordinary work is not confirmed

- **WHEN** the owner creates a record, or edits details that carry no money
- **THEN** it is saved without a confirmation step

#### Scenario: A refusal is reported where the owner is looking

- **WHEN** a confirmed action is refused by the API
- **THEN** the reason is shown on the screen or form the owner acted from, and that screen is not dismissed
