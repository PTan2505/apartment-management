## ADDED Requirements

### Requirement: Rooms can be listed by whether a tenancy holds them

The room listing SHALL accept a filter naming whether to return every room, only those a
tenancy holds, or only those free to let. It SHALL default to every room.

The filter SHALL be applied in the query. Narrowing a page after it has been fetched
returns fewer rows than the page claims and a total that counts rooms the caller was
never shown.

A room is held by the same rule the rest of the system uses — a tenancy with no move-out
and no cancellation, including one running past its agreed term.

#### Scenario: Only the free ones

- **WHEN** rooms are listed asking for free rooms
- **THEN** every room returned has no tenancy holding it, and the total counts only those

#### Scenario: Only the let ones

- **WHEN** rooms are listed asking for let rooms
- **THEN** every room returned is held by a tenancy, and the total counts only those

#### Scenario: The two together account for everything

- **WHEN** the same listing is asked for let rooms and then for free rooms, with every other filter unchanged
- **THEN** the two totals sum to the total with no occupancy filter

#### Scenario: Not asked

- **WHEN** rooms are listed without naming an occupancy
- **THEN** both let and free rooms are returned, exactly as before
