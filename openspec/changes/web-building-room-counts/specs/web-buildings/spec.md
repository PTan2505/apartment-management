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
