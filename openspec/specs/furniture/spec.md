# furniture Specification

## Purpose
What a building furnishes its rooms with, what each room actually holds, and what a
particular tenant was handed on the day they moved in. The last of those is the one that
settles an argument months later, which is why it is frozen rather than derived.
## Requirements
### Requirement: A building declares the furniture it supplies

A building SHALL hold a catalogue of furniture: a name, a kind, a make, and a price,
each entry belonging to one building.

Per building rather than system-wide, following the fee catalogue already in place: the
picker a room chooses from stays short, and one building's inventory does not fill
another's list.

Two offered entries in one building SHALL NOT share a name — at the moment of choosing
one, two entries called "Giường" cannot be told apart.

An entry SHALL be retired rather than deleted, because rooms and hand-over records refer
to it. A retired entry SHALL NOT be offered to a room; rooms that already hold it keep
it. Retiring SHALL release the name.

Only the `owner` SHALL maintain the catalogue. A `manager` SHALL read it.

#### Scenario: Declaring an entry

- **WHEN** the owner adds "Giường gỗ 1m6", a bed, Hoà Phát, 2.000.000
- **THEN** rooms in that building may choose it

#### Scenario: A name already used

- **WHEN** the owner adds an entry whose name an offered entry in that building already has
- **THEN** the system responds with HTTP 409 and nothing is created

#### Scenario: The same name in another building

- **WHEN** the owner adds that name to a different building
- **THEN** it is accepted

#### Scenario: Retiring

- **WHEN** the owner retires an entry
- **THEN** it is no longer offered, and rooms already holding it are unchanged

#### Scenario: A manager

- **WHEN** a manager adds, changes or retires a catalogue entry
- **THEN** the system responds with HTTP 403

### Requirement: A room holds furniture, independently of any tenancy

A room SHALL hold furniture chosen from its building's catalogue, each holding carrying a
quantity, the price COPIED at the moment it was added, its condition, and the date it was
acquired.

It belongs to the ROOM, not to a tenancy. A fridge does not leave when a tenant does, and
requiring the list to be re-entered at every signing is how it stops being maintained.

The price SHALL be copied rather than read from the catalogue, for the same reason a
tenancy copies its rent: re-pricing the catalogue must not silently restate what a room
was furnished with. The condition SHALL be the room's CURRENT condition, which changes as
things wear.

A holding SHALL be removable — furniture is thrown out — and removing it SHALL NOT alter
any hand-over record that already named it.

Only the `owner` SHALL maintain a room's furniture, matching every other write on a room.
A `manager` SHALL read it.

#### Scenario: Furnishing a room

- **WHEN** the owner adds two beds and a fridge to a room from the catalogue
- **THEN** the room holds them, each at the catalogue's price at that moment

#### Scenario: The catalogue is repriced afterwards

- **WHEN** the owner changes a catalogue entry's price
- **THEN** rooms already holding it keep the price they were furnished at

#### Scenario: A retired entry

- **WHEN** the owner tries to add a retired catalogue entry to a room
- **THEN** the system responds with HTTP 400 and nothing is added

#### Scenario: Asking what is in a room

- **WHEN** a room with no running tenancy is retrieved
- **THEN** its furniture is reported, because the furniture is the room's

#### Scenario: Throwing something out

- **WHEN** the owner removes a holding
- **THEN** the room no longer holds it, and hand-over records that named it are unchanged

### Requirement: Signing a tenancy freezes what the tenant received

Creating a tenancy SHALL record a hand-over entry for each item the room holds at that
moment: its name, kind, make, value and condition, copied, plus the date.

Frozen rather than looked up. The room's furniture goes on changing — things are added,
replaced, thrown out — and the question this record answers is what THIS tenant was
handed, which stops being derivable the moment anything changes.

The record SHALL be written in the same operation that creates the tenancy. A tenancy
whose hand-over list is missing is a tenancy nobody can check back in.

A room with no furniture SHALL produce an empty record, not an absent one: "handed over
with nothing" and "nobody recorded it" are different facts.

A hand-over entry SHALL NOT be editable once the tenancy exists. Correcting what was
handed over after the fact is the one operation that would make the record worthless.

#### Scenario: Signing a furnished room

- **WHEN** a tenancy is created for a room holding three items
- **THEN** its hand-over record names all three, with their values and conditions as of that day

#### Scenario: The room changes afterwards

- **WHEN** the owner replaces the fridge during the tenancy
- **THEN** the hand-over record still names the fridge that was handed over

#### Scenario: An unfurnished room

- **WHEN** a tenancy is created for a room holding nothing
- **THEN** the hand-over record exists and is empty

#### Scenario: Nothing is written unless everything is

- **WHEN** writing the hand-over record fails while a tenancy is being created
- **THEN** no tenancy, occupant, invoice or hand-over entry is created

#### Scenario: Correcting it later

- **WHEN** any caller tries to change a hand-over entry's value or hand-over condition
- **THEN** the system refuses

### Requirement: Closing a tenancy checks the furniture back in

Recording a move-out SHALL accept a condition at return for each item on the hand-over
record, stored beside the condition it was handed over in.

Condition SHALL be one of a fixed set — new, good, worn, damaged — with an optional note.
A fixed set is what makes the two ends comparable; free text makes "hơi xước" and "xước
nhẹ" two different conditions.

Checking in SHALL be optional. A move-out SHALL NOT be blocked by it: a tenancy that has
to be closed at ten at night must not wait on an inventory. Items left unchecked SHALL be
reported as unchecked rather than assumed returned in good order.

The system SHALL NOT decide what damage costs, nor deduct anything from a deposit. It
SHALL report which items came back worse than they went out, with the value each was
handed over at, so a charge can be raised from them. Money kept back is charged on an
ad-hoc invoice, which already exists — this change adds no second way.

#### Scenario: Checking items in

- **WHEN** a move-out is recorded naming a condition for each item
- **THEN** each hand-over entry carries its return condition beside its hand-over condition

#### Scenario: Something came back worse

- **WHEN** an item handed over in good condition is returned damaged
- **THEN** it is reported as worse, with the value it was handed over at

#### Scenario: Something was already worn

- **WHEN** an item handed over worn is returned worn
- **THEN** it is not reported as worse

#### Scenario: Closing without checking

- **WHEN** a move-out is recorded with no conditions at all
- **THEN** it succeeds, and every item is reported as unchecked

#### Scenario: Nothing is deducted automatically

- **WHEN** items are returned damaged
- **THEN** no deposit is touched and no invoice is issued by this operation

