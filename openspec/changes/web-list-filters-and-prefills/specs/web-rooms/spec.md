## ADDED Requirements

### Requirement: The rooms list reports occupancy, not liveness

Each room's status SHALL say whether a tenancy holds it — let, or free.

It SHALL NOT mark a room as in service. Every room in a list is in service but the few
that are not, so the mark applied to almost every row and distinguished none of them.

A room OUT OF SERVICE SHALL be shown with a muted row instead, and SHALL still be
labelled. Colour alone is not a label: it does not survive a screenshot sent to somebody
else, it says nothing to a reader who cannot pick the shade out, and on the phone cards
there is no neighbouring row to compare against.

Such a room SHALL NOT be described as free. It holds no tenancy, but it cannot take one,
and offering it as free invites signing an agreement the API refuses.

The list SHALL offer a filter by occupancy, and it SHALL agree with what the rows show.

#### Scenario: A let room

- **WHEN** the owner reads a room a tenancy holds
- **THEN** its status says it is let, and nothing says whether it is in service

#### Scenario: A room out of service

- **WHEN** the owner reads a room taken out of service
- **THEN** its row is muted, it is labelled as stopped, and it is not described as free

#### Scenario: Filtering

- **WHEN** the owner filters to free rooms
- **THEN** no row shown is let, and the count matches what the API reports for the same question

### Requirement: Only a free room is offered for retiring

The action that takes a room out of service SHALL be offered only on a room no tenancy
holds. The API refuses a let one; offering the action teaches only that the software
refuses things at random.

#### Scenario: A let room

- **WHEN** the owner opens the actions of a room a tenancy holds
- **THEN** nothing offers to take it out of service

#### Scenario: A free room

- **WHEN** the owner opens the actions of a free, in-service room
- **THEN** taking it out of service is offered, and confirmed before it happens

### Requirement: The rooms list shows its actions column only to the owner

The column carrying row actions SHALL be absent for any role that has none, rather than
present and empty down the length of the page.

Nothing readable SHALL be withheld with it: the room's code, building, rent, free-from
date and occupancy stay.

#### Scenario: A manager reads the rooms

- **WHEN** a manager opens the rooms list
- **THEN** there is no actions column and no actions button on any row

#### Scenario: The owner reads the rooms

- **WHEN** the owner opens the rooms list
- **THEN** the actions column is present, exactly as before
