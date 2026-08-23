## Purpose

Covers managing buildings from the browser: finding them by location, paging through them, creating and editing them, and taking them in and out of service — including how the screen behaves on a phone and how it reports an action the API refuses.

## ADDED Requirements

### Requirement: The owner can see the buildings they manage

The application SHALL present the buildings the owner manages, showing for each its name, its street address, the ward and city it is in, its electricity and water rates, and whether it is in service.

Retired buildings SHALL be excluded unless they are explicitly asked for, and a retired building SHALL be visibly distinguished from an active one when shown.

While the buildings are being loaded the screen SHALL indicate that, and SHALL NOT present an empty result as though it were a completed one.

#### Scenario: Buildings are listed

- **WHEN** an owner opens the buildings screen
- **THEN** each building is shown with its name, street address, ward, city, both rates, and whether it is in service

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

### Requirement: Rates are displayed without being altered

Every monetary value SHALL be displayed in a form that preserves it. A rate SHALL retain its fractional part, because rates are recorded to a fractional precision and rounding one for display shows the owner a value they did not enter.

Each rate SHALL be shown with the unit it is charged by, so a per-kWh rate cannot be mistaken for a per-person rate.

#### Scenario: A fractional rate keeps its fraction

- **WHEN** a building's electricity rate has a fractional part
- **THEN** it is displayed including that fraction, not rounded to a whole number

#### Scenario: A whole rate is not padded misleadingly

- **WHEN** a building's rate has no fractional part
- **THEN** it is displayed as a whole value

#### Scenario: Rates carry their unit

- **WHEN** a building's rates are displayed
- **THEN** the electricity rate is identifiably per unit of consumption and the water rate identifiably per person

### Requirement: The owner can narrow buildings by location

The application SHALL let the owner narrow the buildings to a city, and to a ward within that city, choosing from the values that buildings actually record rather than typing them.

The ward choices SHALL be limited to wards recorded in the selected city, so a combination that cannot match is not offered.

Changing the city SHALL discard a selected ward that does not exist in the new city, rather than leaving a pair that matches nothing.

The location choices SHALL follow the same rule as the listing about retired buildings: when retired buildings are excluded, their locations SHALL NOT be offered, so choosing a location never produces an empty result.

The owner SHALL be able to clear the filters and return to the full list.

#### Scenario: Filtering by city

- **WHEN** an owner chooses a city
- **THEN** only buildings in that city are shown

#### Scenario: Ward choices follow the city

- **WHEN** an owner chooses a city
- **THEN** the ward choices are limited to wards recorded in that city

#### Scenario: Changing the city clears an impossible ward

- **WHEN** an owner has chosen a ward and then selects a different city that has no such ward
- **THEN** the ward selection is discarded rather than producing a combination that matches nothing

#### Scenario: Filtering by city and ward together

- **WHEN** an owner chooses both a city and a ward
- **THEN** only buildings matching both are shown

#### Scenario: Location choices respect the retired setting

- **WHEN** retired buildings are excluded and a city contains only retired buildings
- **THEN** that city is not offered as a choice

#### Scenario: Clearing the filters

- **WHEN** an owner clears the filters
- **THEN** the full default list is shown again

### Requirement: Results are paged, and paging follows the filters

The application SHALL page through buildings using the API's paging, showing which page is being viewed and how many results there are in total.

Changing any filter SHALL return to the first page. A filter narrows the results, so a page number carried over from a wider result set can point beyond the end of the new one and show nothing while results exist.

The screen SHALL be able to return to a previously viewed page through the browser's back control, and opening a page's address directly SHALL show that page.

#### Scenario: Paging through results

- **WHEN** there are more buildings than fit on one page
- **THEN** the owner can move between pages and each shows its own buildings

#### Scenario: Changing a filter returns to the first page

- **WHEN** an owner is viewing a later page and then changes a filter
- **THEN** the first page of the newly filtered results is shown, not an empty later page

#### Scenario: The current view is addressable

- **WHEN** an owner has chosen filters and a page
- **THEN** the address reflects them, and opening that address directly restores the same view

#### Scenario: Back returns to the previous view

- **WHEN** an owner changes a filter and then uses the browser's back control
- **THEN** the previous filter selection is restored

### Requirement: The owner can create and edit a building

The application SHALL let the owner create a building and edit an existing one, capturing its name, street address, ward, city, country, and both rates.

The form SHALL require exactly what the API requires and no more, so it never rejects input the API would have accepted. Rates SHALL accept fractional values and SHALL NOT accept negative ones. Country SHALL default so it need not be entered.

When the API rejects a submission, the reported problems SHALL be shown against the fields they concern where the API identifies them, and otherwise against the form.

A submission in progress SHALL be indicated, and the same submission SHALL NOT be sent twice.

On success the list SHALL reflect the change without the owner reloading the screen.

#### Scenario: Creating a building

- **WHEN** an owner submits a valid new building
- **THEN** it is created and appears in the list without a reload

#### Scenario: Editing a building

- **WHEN** an owner changes an existing building's details and submits
- **THEN** the changes are saved and the list reflects them without a reload

#### Scenario: Country need not be entered

- **WHEN** an owner creates a building without naming a country
- **THEN** the building is created with the default country

#### Scenario: A fractional rate is accepted

- **WHEN** an owner enters a rate with a fractional part
- **THEN** it is accepted and stored as entered

#### Scenario: A negative rate is rejected

- **WHEN** an owner enters a negative rate
- **THEN** the form reports it and the submission is not sent

#### Scenario: Required fields are reported

- **WHEN** an owner submits without a name, street address, ward, or city
- **THEN** the form reports which are required and the submission is not sent

#### Scenario: Field-level problems from the API are attributed

- **WHEN** the API rejects a submission and identifies which fields are at fault
- **THEN** those problems are shown against those fields

#### Scenario: Submission in progress

- **WHEN** a submission is in flight
- **THEN** the form indicates it and a second submission of the same form is prevented

#### Scenario: The form is usable on a phone

- **WHEN** an owner opens the form on a narrow viewport
- **THEN** it is usable at that width, with every field reachable and the form dismissible

### Requirement: The owner can take a building out of service and back

The application SHALL let the owner retire a building and restore a retired one.

Retiring SHALL require confirmation, because a retired building disappears from the default list and from the location choices. Restoring SHALL NOT, because it is not destructive and is immediately visible.

When the API refuses to retire a building because one of its rooms still has an active lease, the screen SHALL report the reason the API gave, rather than a generic failure. This is an expected outcome of a reasonable action, not a fault.

The screen SHALL NOT suggest that retiring a building also retires its rooms, because it does not.

#### Scenario: Retiring a building

- **WHEN** an owner retires a building and confirms
- **THEN** the building is marked retired and leaves the default list

#### Scenario: Retiring is confirmed first

- **WHEN** an owner starts to retire a building and does not confirm
- **THEN** the building remains in service

#### Scenario: Retiring a building that still has a tenant

- **WHEN** an owner confirms retiring a building whose room still has an active lease
- **THEN** the screen reports the reason the API gave, and the building remains in service

#### Scenario: Restoring a retired building

- **WHEN** an owner restores a retired building
- **THEN** it is marked in service again and reappears in the default list

#### Scenario: Restore needs no confirmation

- **WHEN** an owner restores a retired building
- **THEN** it is restored without a confirmation step

### Requirement: The screen adapts to the viewport

The buildings SHALL be presented as a table on a wide viewport and as a list of per-building cards on a narrow one, because a table of this width cannot be usefully narrowed and horizontal scrolling hides the columns that matter.

Both presentations SHALL show the same buildings and offer the same actions.

The screen SHALL NOT cause the page to scroll horizontally at any supported width.

#### Scenario: Table on a wide viewport

- **WHEN** an owner views the buildings on a wide viewport
- **THEN** they are presented as a table

#### Scenario: Cards on a narrow viewport

- **WHEN** an owner views the buildings on a narrow viewport
- **THEN** they are presented as per-building cards rather than a narrowed table

#### Scenario: The same actions in both presentations

- **WHEN** an owner views the buildings at either width
- **THEN** the same buildings are shown and the same actions are available for each

#### Scenario: No horizontal scrolling

- **WHEN** an owner views the buildings at any supported width down to a small phone
- **THEN** the page does not scroll horizontally

### Requirement: Having nothing is distinguished from matching nothing

The screen SHALL distinguish having no buildings at all from having none that match the current filters, and SHALL offer the action that fits: creating a building in the first case, clearing the filters in the second.

#### Scenario: No buildings exist

- **WHEN** an owner opens the buildings screen and no building has been created
- **THEN** the screen says so and offers to create one

#### Scenario: No buildings match the filters

- **WHEN** an owner's filters match no building
- **THEN** the screen says nothing matched and offers to clear the filters, rather than suggesting none exist
