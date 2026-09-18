## ADDED Requirements

### Requirement: The buildings table shows how full each building is
The screen SHALL show, for each building, how many of its rooms are let and how many are empty, taking both figures from the list response rather than counting rooms itself.

The two figures SHALL be distinguishable at a glance rather than reading as one number, and SHALL remain legible at phone width, where the list is a stack of cards.

#### Scenario: Owner reads occupancy from the list
- **WHEN** the owner opens the buildings screen
- **THEN** each building shows its number of let rooms and its number of empty rooms

#### Scenario: Phone width
- **WHEN** the owner opens the buildings screen at phone width
- **THEN** each building's card shows both figures without the card scrolling sideways

### Requirement: The whole row opens the building
The screen SHALL open a building's detail page when the owner clicks anywhere on its row that is not another control, instead of only on its name.

The row SHALL remain reachable and operable from the keyboard, and SHALL offer the same middle-click and modifier-click behaviour as a link, because a row that opens a page is a link whatever it is built from.

Controls inside the row — the actions menu and anything it opens — SHALL NOT trigger the navigation.

#### Scenario: Click anywhere on the row
- **WHEN** the owner clicks a building's row away from its actions menu
- **THEN** the building's detail page opens

#### Scenario: The actions menu does not navigate
- **WHEN** the owner opens the row's actions menu
- **THEN** the building's detail page does not open

#### Scenario: Keyboard
- **WHEN** the owner moves focus to a building's row and presses Enter
- **THEN** the building's detail page opens

### Requirement: A building's own page states how its rooms stand
The building detail screen SHALL show, above its rooms table, how many rooms are in service, how many of those are let, how many are empty, and how many have been taken out of service.

The figures SHALL come from the building, not from the rooms table below them: that table is paged, so counting what is on screen would answer for the page rather than for the building.

The rooms in service SHALL be stated rather than left to be added up, because it is the figure the other two are read against.

#### Scenario: Owner opens a building
- **WHEN** the owner opens a building's page
- **THEN** the four figures appear above its rooms table, and the rooms-in-service figure equals the let and empty figures added together

#### Scenario: Rooms out of service are visible as such
- **GIVEN** a building with rooms taken out of service
- **WHEN** the owner opens that building's page
- **THEN** those rooms are reported in their own figure, while the table below still lists only the rooms in service

#### Scenario: Phone width
- **WHEN** the owner opens a building's page at phone width
- **THEN** all four figures are readable without the page scrolling sideways
