## MODIFIED Requirements

### Requirement: The owner can see the buildings they manage

The application SHALL present the buildings the owner manages, showing for each its name, its street address, the ward and city it is in, its electricity and water rates, and whether it is in service.

Each listed building SHALL offer a way to open it on its own, so that what belongs to it — beginning with its rooms — is reachable from the list rather than only from a separate screen.

Retired buildings SHALL be excluded unless they are explicitly asked for, and a retired building SHALL be visibly distinguished from an active one when shown.

While the buildings are being loaded the screen SHALL indicate that, and SHALL NOT present an empty result as though it were a completed one.

#### Scenario: Buildings are listed

- **WHEN** an owner opens the buildings screen
- **THEN** each building is shown with its name, street address, ward, city, both rates, and whether it is in service

#### Scenario: A building can be opened from the list

- **WHEN** an owner opens a building from the list
- **THEN** that building's own view is shown

#### Scenario: A retired building can be opened too

- **WHEN** an owner has asked for retired buildings to be included and opens one
- **THEN** that building's own view is shown, so its rooms remain reachable

#### Scenario: Retired buildings are hidden by default

- **WHEN** an owner opens the buildings screen and some buildings have been retired
- **THEN** only buildings in service are shown

#### Scenario: Retired buildings can be shown

- **WHEN** an owner asks for retired buildings to be included
- **THEN** retired buildings appear alongside active ones, each marked as retired

#### Scenario: Loading is distinguishable from empty

- **WHEN** the buildings are still being fetched
- **THEN** the screen indicates that it is loading rather than showing an empty result

#### Scenario: The buildings cannot be fetched

- **WHEN** fetching the buildings fails
- **THEN** the screen reports the failure and offers to try again, rather than showing an empty result
