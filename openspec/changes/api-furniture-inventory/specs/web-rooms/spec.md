## ADDED Requirements

### Requirement: A room's page lists what furnishes it

A room's page SHALL show the furniture the room holds — name, make, quantity, value and
current condition — and SHALL let the `owner` add from the building's catalogue, change a
quantity or condition, and remove an item.

It SHALL say what this list is for, because the list alone is ambiguous: these items are
written into the hand-over record of every tenancy signed from now on, and they are what
a departing tenant is checked against. A reader who thinks it is an inventory for its own
sake will not keep it current.

A room with nothing SHALL say so, and SHALL say that tenancies signed there will record
an empty hand-over.

Where the building's catalogue is empty, the add control SHALL say so and point at the
building's page rather than opening an empty picker.

A `manager` SHALL see all of it and be offered none of the controls.

#### Scenario: A furnished room

- **WHEN** the owner opens a room holding three items
- **THEN** each is listed with its make, quantity, value and condition, and the total value is stated

#### Scenario: Adding

- **WHEN** the owner adds an item from the catalogue with a quantity
- **THEN** it appears without a reload, at the catalogue's current price

#### Scenario: An empty catalogue

- **WHEN** the owner opens a room whose building has no catalogue entries
- **THEN** the page says so and points at the building's page

#### Scenario: An unfurnished room

- **WHEN** the owner opens a room holding nothing
- **THEN** it says so, and says that tenancies signed there will hand over nothing

#### Scenario: A manager

- **WHEN** a manager opens the room
- **THEN** the furniture is listed and nothing offers to change it

### Requirement: The building's page maintains the furniture catalogue

The building's page SHALL let the `owner` maintain its furniture catalogue — add an
entry, correct its name, kind, make or price, retire one and bring it back — beside the
service-fee catalogue it already carries.

It SHALL say that an entry here furnishes nobody by itself: a room has to hold it. The
same two-level split as service fees, and the same place people get it wrong.

Re-pricing SHALL be described as reaching rooms furnished afterwards. Rooms already
holding the item keep the value they were furnished at.

A retired entry SHALL stay visible to the owner, set apart.

#### Scenario: Adding a catalogue entry

- **WHEN** the owner adds a bed with a make and a price
- **THEN** rooms in that building may choose it, and the page says choosing is a separate step

#### Scenario: Re-pricing

- **WHEN** the owner changes an entry's price
- **THEN** the form says rooms already furnished keep their value

#### Scenario: A manager

- **WHEN** a manager opens the building's page
- **THEN** the catalogue is listed and nothing offers to change it
