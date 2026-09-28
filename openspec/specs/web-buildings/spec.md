## Purpose

Covers managing buildings from the browser: finding them by location, paging through them, creating and editing them, and taking them in and out of service — including how the screen behaves on a phone and how it reports an action the API refuses.
## Requirements
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

The application SHALL let the owner create a building and edit an existing one, capturing its name, address, both rates, and the number of months of rent its tenancies take as a deposit by default.

The street line, ward, city, and country SHALL each be presented as a field, and SHALL be editable by default. Address lookup is optional infrastructure and its data is incomplete — a deployment may have none configured, the provider may be unreachable, an address may not be in its data, and a resolved value may be wrong — so entering an address by hand SHALL always work. Requiring a chosen place in order to create a building would make an external service a prerequisite for a core operation.

Where lookup is available, the street address field SHALL itself act as the search: what is typed into it SHALL be looked up, and matching places SHALL be offered beneath it. There SHALL NOT be a separate search box, because an address typed to find a place and an address recorded on the building are the same thing, and two fields for it would ask for it twice.

Choosing a place SHALL fill all four fields from it and SHALL record which place they came from.

Looking up SHALL NOT happen on every keystroke, and what is typed SHALL be part of the building's address immediately, so a submission never omits text that had been entered but not yet looked up.

Once filled from a chosen place the four fields SHALL become read-only, because they then describe that place rather than whatever was typed. Choosing a different place SHALL replace them with the new one's values.

The owner SHALL be able to make the fields editable again. Doing so SHALL discard the recorded place, because the values may no longer be the ones it supplied.

Where lookup cannot work — none configured, or the provider unavailable — the form SHALL say so and the fields SHALL remain editable, rather than offering a search that cannot answer.

The form SHALL require exactly what the API requires and no more, so it never rejects input the API would have accepted. Rates SHALL accept fractional values and SHALL NOT accept negative ones. The default deposit SHALL accept only whole months, SHALL NOT accept negative ones, and SHALL accept zero, for a building that takes none. Country SHALL default so it need not be entered.

When the API rejects a submission, the reported problems SHALL be shown against the fields they concern where the API identifies them, and otherwise against the form.

A submission in progress SHALL be indicated, and the same submission SHALL NOT be sent twice.

On success the list SHALL reflect the change without the owner reloading the screen.

#### Scenario: Creating a building

- **WHEN** an owner submits a valid new building
- **THEN** it is created and appears in the list without a reload

#### Scenario: The address fields are editable by default

- **WHEN** an owner opens the form
- **THEN** the street line, ward, city, and country are shown as editable fields

#### Scenario: Choosing an address fills its parts

- **WHEN** an owner searches for an address and chooses a result
- **THEN** the street line, ward, city, and country are filled from that place

#### Scenario: Filled fields become read-only

- **WHEN** an owner has chosen an address
- **THEN** the four fields show its values and cannot be edited directly

#### Scenario: Choosing a different address replaces the values

- **WHEN** an owner chooses one address and then chooses another
- **THEN** the four fields are refilled from the second place

#### Scenario: Making the fields editable again

- **WHEN** an owner makes the filled fields editable again
- **THEN** they keep their values, become editable, and the building no longer records the place they came from

#### Scenario: A building created from a chosen address records its place

- **WHEN** an owner creates a building from an address chosen by searching
- **THEN** the building records which place the address came from

#### Scenario: Entering the address by hand

- **WHEN** an owner fills the address fields without choosing any place
- **THEN** the building is created and records no place

#### Scenario: A chosen place with no street

- **WHEN** an owner chooses a place that names only an administrative area, so no street is supplied
- **THEN** the street line is filled as empty, and the owner can make the fields editable to supply it

#### Scenario: Choosing a place after typing

- **WHEN** an owner types an address and then chooses one of the places offered
- **THEN** the chosen place's values replace what was typed, and that place is recorded

#### Scenario: A filled field shows its label clearly

- **WHEN** a field has been filled from a chosen place
- **THEN** its label is presented as it is for a field typed into by hand, without obscuring the value

#### Scenario: Lookup is not configured

- **WHEN** an owner opens the form on a deployment where address lookup is not configured
- **THEN** no search is offered, the form explains why, and the address fields remain editable

#### Scenario: The provider is unavailable

- **WHEN** address lookup fails because the provider cannot be reached
- **THEN** the form says so and manual entry remains available, so a building can still be created

#### Scenario: A search matching nothing

- **WHEN** an owner searches for an address that matches no place
- **THEN** the form says nothing was found, rather than reporting a failure, and the fields remain editable

#### Scenario: The candidate list closes once a place is chosen

- **WHEN** an owner chooses a place from the candidates
- **THEN** the remaining candidates are no longer listed

#### Scenario: Looking up does not issue a request per keystroke

- **WHEN** an owner types a multi-character address
- **THEN** matching places are requested once the typing settles rather than once per character

#### Scenario: There is one address field, not two

- **WHEN** an owner opens the form
- **THEN** the street address is asked for once, and typing into that field is what looks the address up

#### Scenario: Typed text is not lost by submitting quickly

- **WHEN** an owner types a street address and submits before any lookup has run
- **THEN** the building records exactly what was typed

#### Scenario: Editing a building

- **WHEN** an owner changes an existing building's details and submits
- **THEN** the changes are saved and the list reflects them without a reload

#### Scenario: Editing a building's address

- **WHEN** an owner edits an existing building
- **THEN** its address fields are shown editable, whether or not it was created from a chosen place

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

#### Scenario: Setting the deposit a building takes

- **WHEN** an owner creates or edits a building and states the months of rent its tenancies take as a deposit
- **THEN** the building records that number, and it is the figure tenancies signed there fall back to

#### Scenario: A fractional deposit is refused before it is sent

- **WHEN** an owner types half a month as a building's default deposit
- **THEN** the form says so and does not submit

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

### Requirement: The buildings screen filters by in-service status
The screen SHALL offer the in-service status as a choice of three — everything, only what is in service, only what is out of service — in one control rather than a switch that can only widen the list.

The default SHALL be everything, so a building taken out of service is visible until the owner narrows the list rather than hidden until they think to look.

The choice SHALL live in the page address alongside the other filters, so a filtered view can be returned to, and SHALL apply to the location choices offered beside it, which must not offer a location that yields nothing.

#### Scenario: Default shows everything
- **WHEN** the owner opens the buildings screen
- **THEN** buildings in service and out of service are both listed, and the status control reads as everything

#### Scenario: Narrowing to what is out of service
- **WHEN** the owner chooses to see only what is out of service
- **THEN** only those buildings are listed

#### Scenario: The choice survives a reload
- **WHEN** the owner chooses a status and reloads the page
- **THEN** the same status is still chosen and the same buildings are listed

### Requirement: The rate fields say who a new figure will reach
The building form SHALL state, beside its electricity and water rate fields, that a changed rate applies to tenancies signed from then on and to invoices issued for them, and not to tenancies already signed.

The statement SHALL be shown when editing an existing building, where the question arises, and SHALL NOT be shown when creating one, where there is nothing already signed to reassure anyone about.

#### Scenario: Editing a building
- **WHEN** the owner opens an existing building for editing
- **THEN** the form states that changed rates apply only to tenancies signed from then on

#### Scenario: Creating a building
- **WHEN** the owner creates a new building
- **THEN** that statement is absent

### Requirement: Taking a building out of service and putting it back are both confirmed

The application SHALL let the owner retire a building and restore a retired one, and SHALL confirm both before sending anything.

Retiring, because a retired building disappears from the default list and from the location choices. Restoring, because it returns a building to the lists, the filters and the places a tenancy can be signed — a change to what the rest of the application offers, made from a menu item beside ordinary ones. Reversible is not the same as harmless.

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

- **WHEN** an owner restores a retired building and confirms
- **THEN** it is marked in service again and reappears in the default list

#### Scenario: Restoring is confirmed first

- **WHEN** an owner starts to restore a retired building and does not confirm
- **THEN** no request is sent and the building remains retired

### Requirement: A change to a building's rates is confirmed before it is saved

The application SHALL ask the owner to confirm saving a building whose electricity or water rate has changed, and SHALL show each changed rate as its previous value and its new one.

The confirmation SHALL say that new rates apply only to tenancies and invoices made from now on, because that is the question an owner asks at exactly this moment and the answer is not visible on the form.

Saving a building whose rates are unchanged SHALL NOT be confirmed, however many other details were edited. A rate is what later billing reads; a name or an address is not.

#### Scenario: Saving a changed rate

- **WHEN** an owner changes a building's electricity or water rate and saves
- **THEN** a confirmation lists each changed rate as old and new, and nothing is sent until it is confirmed

#### Scenario: Saving other details

- **WHEN** an owner changes a building's name or address but neither rate and saves
- **THEN** the change is saved without a confirmation step

#### Scenario: The confirmation says what the new rate applies to

- **WHEN** an owner is asked to confirm a changed rate
- **THEN** the confirmation says the new rate applies to tenancies and invoices made from now on

#### Scenario: Declining keeps the form

- **WHEN** an owner declines the confirmation
- **THEN** the form is still open with the rates they entered, and nothing was sent

### Requirement: A building's page states what it is configured to

The building's own page SHALL show what the owner has set it to: its electricity rate,
its water rate per person, the number of months of rent its tenancies take as a deposit
by default, and the service fees it charges beside rent.

Each figure SHALL be shown as a named field rather than as running text, and SHALL say
what it reaches: a rate applies to tenancies signed from then on, and the deposit is the
figure a new tenancy falls back to. A reader must be able to tell a SETTING from the
building's address, which sits directly above it.

A building with no service fees SHALL say so, rather than showing an empty area.

Nothing here is narrowed by role. A manager reads every figure — they quote the rates
when they sign a tenancy — and what they lose is only the ability to change them.

#### Scenario: The owner opens a building

- **WHEN** the owner opens a building's page
- **THEN** its electricity rate, water rate, default deposit months and service fees are shown, each named, with what it applies to stated

#### Scenario: A building that charges nothing beyond rent

- **WHEN** a building has no service fees configured
- **THEN** the page says it has none rather than leaving the area blank

#### Scenario: A manager opens a building

- **WHEN** a manager opens a building they cover
- **THEN** they see the same figures, including the fee catalogue

#### Scenario: A building that takes no deposit

- **WHEN** a building's default deposit is zero months
- **THEN** the page says it takes no deposit rather than showing "0 tháng"

### Requirement: The owner edits a building from its own page

The page SHALL offer the owner a control that opens the same form the buildings list
uses, and on saving SHALL show the new values without the owner reloading.

The control SHALL NOT be shown to anyone else, by the rule that a control a role may not
use is not drawn.

#### Scenario: The owner changes a setting

- **WHEN** the owner edits a building from its page and saves
- **THEN** the form closes and the page shows the changed figure without a reload

#### Scenario: A manager reads the same page

- **WHEN** a manager opens a building's page
- **THEN** no control offers to edit it

### Requirement: The owner manages what a building charges beside rent

A building's page SHALL let the owner add a service fee, change its name and price,
retire it, and bring a retired one back. Each fee SHALL show its name and its monthly
price.

The page SHALL say that setting a fee here charges nobody by itself — a tenancy has to
take it up — because a list of fees is otherwise indistinguishable from a list of
charges, and an owner would reasonably assume their tenants were already being billed.

Repricing SHALL be described as reaching only tenancies that take the fee up
afterwards. A tenancy that already has it holds its own copy of the price.

A retired fee SHALL remain visible to the owner, set apart from the ones still offered,
because it can be brought back and because tenancies may still be billed for it.

Only the owner SHALL be offered any of these controls. A manager SHALL see the same
fees and no way to change them.

#### Scenario: Adding a fee

- **WHEN** the owner adds a fee with a name and a monthly price
- **THEN** it appears in the building's list without a reload, and is offered to tenancies in that building

#### Scenario: A name the building already uses

- **WHEN** the owner adds a fee whose name an offered fee already has
- **THEN** the form stays open, says the name is taken, and nothing is created

#### Scenario: Retiring a fee

- **WHEN** the owner retires a fee, after being told that tenancies already holding it keep being charged
- **THEN** it moves to the retired group and is no longer offered to new tenancies

#### Scenario: Bringing one back

- **WHEN** the owner restores a retired fee
- **THEN** it is offered again

#### Scenario: A manager reads the catalogue

- **WHEN** a manager opens a building's page
- **THEN** the fees and their prices are shown, and nothing offers to add, change or retire one

#### Scenario: A building with no fees

- **WHEN** a building has no service fees
- **THEN** the page says so, and invites the owner to add one

### Requirement: The fee form asks what the fee is charged per

Adding or changing a service fee SHALL ask whether it is charged per room or per person,
and SHALL say what each means in terms of the bill rather than in terms of the model: a
per-room fee is the same amount whoever lives there; a per-person fee is multiplied by
how many people the tenancy records.

The form SHALL also offer marking the fee as applying to new tenancies automatically,
and SHALL state that tenancies already signed are not affected.

Where changing an existing fee's basis, the form SHALL say the change reaches only
tenancies that take it up afterwards.

A fee's row SHALL show what it is charged per, so an owner scanning the list can tell a
flat charge from one that scales.

#### Scenario: Adding a per-person fee

- **WHEN** the owner adds a fee and chooses per person
- **THEN** the fee is created on that basis and its row says so

#### Scenario: Marking a fee as automatic

- **WHEN** the owner marks a fee as applying to new tenancies
- **THEN** the form says tenancies already signed keep what they agreed, and the row shows the fee is automatic

#### Scenario: Reading the list

- **WHEN** the owner reads a building's fees
- **THEN** each row states whether it is charged per room or per person

