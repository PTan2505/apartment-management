## Purpose

Lets an owner define and maintain the individual rooms inside a building — each identified by a room code and carrying the base monthly rent that later leases and invoices bill against.
## Requirements
### Requirement: Owner can create a room in a building
The system SHALL allow an authenticated `owner` to create a room belonging to an existing building, with a room code, a base monthly rent, and OPTIONALLY the electricity meter reading the room stands at. Base rent MUST NOT be negative, and neither MUST the meter reading.

**The meter reading is the room's starting position and nothing else.** Every other reading this system holds is one half of a difference — consumption is always a closing figure minus an opening one — and this is the only figure that has nothing before it. It therefore has to be stated rather than derived, and the moment to state it is when the room is added, while the owner is looking at the meter.

It SHALL remain optional. Rooms already exist without one, and no figure can honestly be invented for them.

Zero SHALL be accepted as a stated value, distinct from omitting it. A meter genuinely at zero and a meter nobody read are different facts, and treating them alike is what would charge an owner for a meter's entire history as one month's consumption.

#### Scenario: Successful creation
- **WHEN** an authenticated owner creates a room with a valid room code and base rent in an existing active building
- **THEN** the system creates the room as active and responds with HTTP 201 and the created room

#### Scenario: Creating a room with its meter reading

- **WHEN** an authenticated owner creates a room stating the meter reads 8,432
- **THEN** the room records 8,432 as its opening reading

#### Scenario: Creating a room without a meter reading

- **WHEN** an authenticated owner creates a room without stating a meter reading
- **THEN** the room is created with no opening reading recorded

#### Scenario: A meter genuinely at zero

- **WHEN** an authenticated owner creates a room stating the meter reads 0
- **THEN** the room records 0, which is a different fact from having no reading recorded

#### Scenario: A negative meter reading
- **WHEN** an authenticated owner supplies a negative meter reading
- **THEN** the system responds with HTTP 400 and does not create the room

#### Scenario: Building does not exist
- **WHEN** an authenticated owner creates a room referencing a building id that does not exist
- **THEN** the system responds with HTTP 404 and does not create the room

#### Scenario: Building is retired
- **WHEN** an authenticated owner creates a room in a building that has been retired
- **THEN** the system responds with HTTP 400 and does not create the room

#### Scenario: Negative base rent rejected
- **WHEN** an authenticated owner submits a negative base rent
- **THEN** the system responds with HTTP 400 and does not create the room

### Requirement: Room codes are unique among active rooms in a building
The system SHALL reject a room whose code duplicates that of another active room in the same building. Room codes belonging to retired rooms SHALL be reusable, and the same code MAY exist in different buildings.

#### Scenario: Duplicate code in the same building
- **WHEN** an authenticated owner creates a room whose code matches an existing active room in the same building
- **THEN** the system responds with HTTP 409 and does not create the room

#### Scenario: Reusing the code of a retired room
- **WHEN** an authenticated owner creates a room whose code matches a retired room in the same building
- **THEN** the system creates the new room successfully and the retired room's record is unchanged

#### Scenario: Same code in a different building
- **WHEN** an authenticated owner creates a room whose code matches an active room in a different building
- **THEN** the system creates the room successfully

### Requirement: Owner can list and retrieve rooms
The system SHALL allow an authenticated `owner` to list rooms, filter them by building, by whether they are in service, search them by room code, and retrieve a single room by id.

The in-service filter SHALL accept three answers — only rooms in service, only rooms taken out of service, or both. When it is not given, listing SHALL return only rooms in service, so a caller that does not ask about retirement is unaffected.

The room-code search SHALL match any room whose code contains the given text, SHALL ignore case, and SHALL be combinable with the other filters. Room codes SHALL NOT be usable in place of a room id, because the same code may exist in several buildings and may be reused after a room is retired. Listing SHALL be paginated using the shared paginated response contract, so the response carries a `data` array and a `meta` object describing the page and totals rather than a bare array.

Every room SHALL report the building it belongs to, identifying that building by both id and display name, so a room can be shown and understood without a further request. A room code identifies a room only within its building, so a room reported without its building is ambiguous. The building SHALL be reported identically wherever a room is returned, whether listed or retrieved singly.

The room SHALL continue to report the building's id directly as well, so callers reading it are unaffected.

The reported building SHALL be limited to what identifies it. Its rates, address, and status SHALL NOT be included, because they belong to the building's own representation and would be duplicated into every room that references it.

#### Scenario: Listing rooms in a building
- **WHEN** an authenticated owner lists rooms filtered by a building id
- **THEN** the response contains only that building's active rooms

#### Scenario: Listing can include retired rooms
- **WHEN** an authenticated owner lists rooms explicitly requesting retired ones to be included
- **THEN** the response contains both active and retired rooms

#### Scenario: Retrieving a room that does not exist
- **WHEN** an authenticated owner requests a room id that does not exist
- **THEN** the system responds with HTTP 404

#### Scenario: A listed room reports its building
- **WHEN** an authenticated owner lists rooms
- **THEN** each room reports the building it belongs to, by id and display name

#### Scenario: A retrieved room reports its building
- **WHEN** an authenticated owner retrieves a single room by id
- **THEN** it reports its building in the same form as a listed room does

#### Scenario: The reported building is limited to what identifies it
- **WHEN** a room reports its building
- **THEN** that building carries its id and display name, and does not carry its rates, address, or active state

#### Scenario: The building id is still reported directly
- **WHEN** an authenticated owner lists or retrieves a room
- **THEN** the room still reports its building's id as a direct field, so a caller reading it continues to work

#### Scenario: Rooms sharing a code are distinguishable
- **WHEN** an authenticated owner searches a room code that exists in more than one building
- **THEN** each returned room reports its own building, so the results can be told apart

#### Scenario: A retired room still reports its building
- **WHEN** an authenticated owner lists rooms including retired ones
- **THEN** a retired room reports its building exactly as an active one does

#### Scenario: Searching by room code within a building
- **WHEN** an authenticated owner lists rooms filtered by a building id and searching for a room code
- **THEN** the response contains only that building's active rooms whose code contains the search text

#### Scenario: Search matches every room containing the text
- **WHEN** an authenticated owner searches for a room code that several rooms' codes contain, such as searching `10` where rooms `10`, `101` and `102` exist
- **THEN** the response contains all of those rooms, because the search is a partial match rather than an exact code lookup

#### Scenario: Search ignores case
- **WHEN** an authenticated owner searches using different letter casing from the stored room code
- **THEN** the response still contains the matching rooms

#### Scenario: The same room code across buildings
- **WHEN** an authenticated owner searches by a room code without naming a building, and several buildings each have an active room with that code
- **THEN** the response contains one entry per matching building, because a room code does not identify a single room on its own

#### Scenario: Reused room code with retired history
- **WHEN** an authenticated owner searches by a room code in a building where an earlier room with that code was retired and a new active room reuses it, requesting retired rooms to be included
- **THEN** the response contains both the retired room and the active one

#### Scenario: Search with no match
- **WHEN** an authenticated owner searches by text that no room code contains
- **THEN** the system responds with HTTP 200 and an empty list

#### Scenario: Room listing is paginated
- **WHEN** an authenticated owner lists rooms
- **THEN** the response is the shared paginated shape, with the rooms in `data` and the page, page size, and totals in `meta`

#### Scenario: Paging applies to searched and filtered results
- **WHEN** an authenticated owner searches rooms by code within a building and asks for a specific page
- **THEN** the items and totals describe only the rooms matching that building and search

#### Scenario: Listing can include retired rooms
- **WHEN** an authenticated owner lists rooms asking for both statuses
- **THEN** the response contains both rooms in service and rooms out of service

#### Scenario: Listing rooms in a building
- **WHEN** an authenticated owner lists rooms filtered by a building id
- **THEN** the response contains only that building's rooms that are in service

#### Scenario: Listing everything
- **WHEN** an authenticated owner lists rooms asking for both statuses
- **THEN** the response contains rooms in service and rooms out of service

#### Scenario: Listing only what is out of service
- **WHEN** an authenticated owner lists rooms asking only for those out of service
- **THEN** the response contains only retired rooms, and none that are in service

#### Scenario: An unknown status is refused
- **WHEN** an authenticated owner lists rooms naming a status that is not one of the three
- **THEN** the system responds with HTTP 400

#### Scenario: Retrieving a room that does not exist
- **WHEN** an authenticated owner requests a room id that does not exist
- **THEN** the system responds with HTTP 404

#### Scenario: A listed room reports its building
- **WHEN** an authenticated owner lists rooms
- **THEN** each room reports the building it belongs to, by id and display name

#### Scenario: A retrieved room reports its building
- **WHEN** an authenticated owner retrieves a single room by id
- **THEN** it reports its building in the same form as a listed room does

#### Scenario: The reported building is limited to what identifies it
- **WHEN** a room reports its building
- **THEN** that building carries its id and display name, and does not carry its rates, address, or active state

### Requirement: Owner can update a room
The system SHALL allow an authenticated `owner` to update a room's code and base monthly rent. A room's base rent is what the room asks of a prospective tenant; it is not what any current tenant pays, because a lease records its own agreed rent when it is created.

Changing the base rent SHALL therefore affect only leases created afterwards. It SHALL NOT alter any invoice already issued, and SHALL NOT change what an existing lease is billed, whether that lease is running or finished.

#### Scenario: Successful update
- **WHEN** an authenticated owner updates an existing room with valid values
- **THEN** the system saves the changes and responds with HTTP 200 and the updated room

#### Scenario: Update to a duplicate active code
- **WHEN** an authenticated owner updates a room's code to one already used by another active room in the same building
- **THEN** the system responds with HTTP 409 and does not apply the change

#### Scenario: Updating a room that does not exist
- **WHEN** an authenticated owner updates a room id that does not exist
- **THEN** the system responds with HTTP 404

#### Scenario: A running lease is unaffected by a rent change
- **WHEN** an authenticated owner changes the base rent of a room that has an active lease
- **THEN** that lease's agreed rent is unchanged, and invoices generated for it afterwards still charge the agreed rent

#### Scenario: A new lease picks up the changed rent
- **WHEN** an authenticated owner changes a room's base rent and then creates a new lease for that room without supplying an agreed rent
- **THEN** the new lease records the changed rent

### Requirement: Owner can retire and restore a room
The system SHALL allow an authenticated `owner` to retire a room by marking it inactive, and to restore a retired room. The system SHALL NOT support permanently deleting a room, so that leases and invoices referencing it retain their history. The system SHALL reject retiring a room that has an active lease, so an occupied room cannot be taken out of service while a tenant still holds it.

#### Scenario: Retiring a room
- **WHEN** an authenticated owner retires an active room with no active lease
- **THEN** the room is marked inactive, is excluded from default room listings, and its record still exists

#### Scenario: Retiring an occupied room
- **WHEN** an authenticated owner retires a room that has an active lease
- **THEN** the system responds with HTTP 409 and the room remains active

#### Scenario: Retiring a room after its tenant moves out
- **WHEN** an authenticated owner retires a room whose only lease has recorded a move-out
- **THEN** the room is marked inactive

#### Scenario: Restoring a retired room
- **WHEN** an authenticated owner restores a retired room whose code is not in use by another active room in the same building
- **THEN** the room is marked active again and reappears in default room listings

#### Scenario: Restoring a room whose code was reused
- **WHEN** an authenticated owner restores a retired room whose code is now used by another active room in the same building
- **THEN** the system responds with HTTP 409 and the room remains retired

### Requirement: Room endpoints require an authenticated owner
The system SHALL reject any room request that is unauthenticated or made by a user whose role is not `owner`.

#### Scenario: Unauthenticated request
- **WHEN** a request to any room endpoint has no valid access token
- **THEN** the system responds with HTTP 401 and does not process the request

#### Scenario: Authenticated non-owner request
- **WHEN** a request to any room endpoint carries a valid access token for a user whose role is not `owner`
- **THEN** the system responds with HTTP 403 and does not process the request

### Requirement: A room reports whether it is currently let

Every room the system returns SHALL report whether a tenancy is currently running in it, and SHALL do so identically whether the room is listed or retrieved on its own.

Whether a room is free is a fact about the room, not a conclusion to be assembled by whoever asks. Without it, a caller wanting to know which rooms can be let has to fetch every running tenancy and subtract — a second request whose cost grows with the number of tenancies, and an answer that is stale the moment it is computed. The system already knows this to refuse retiring an occupied room; it simply does not say it.

The system SHALL also allow rooms to be filtered to those with no running tenancy, combinable with the existing filters. A caller offering a choice of rooms to let needs the vacant ones, not all of them minus a list it has to work out.

This reports only whether a tenancy is running, not which one. A room's representation SHALL NOT carry the tenancy's own details — those belong to the tenancy, and duplicating them into every room repeats the mistake this requirement avoids.

#### Scenario: An occupied room says so

- **WHEN** an authenticated owner retrieves a room that has a running tenancy
- **THEN** the response reports the room as let

#### Scenario: A vacant room says so

- **WHEN** an authenticated owner retrieves a room with no running tenancy
- **THEN** the response reports the room as not let

#### Scenario: A room whose tenancy has ended is vacant again

- **WHEN** the only tenancy in a room has recorded a move-out
- **THEN** the room is reported as not let

#### Scenario: A tenancy past its term still holds the room

- **WHEN** a room's tenancy has passed its expected end date with no move-out recorded
- **THEN** the room is still reported as let, because the tenancy has not been closed and the room is not free to let again

#### Scenario: Listed rooms report it too

- **WHEN** an authenticated owner lists rooms
- **THEN** each reports whether it is let, in the same form as when retrieved singly

#### Scenario: Filtering to rooms that can be let

- **WHEN** an authenticated owner lists rooms filtered to those with no running tenancy
- **THEN** the response contains only rooms that are not let

#### Scenario: The vacancy filter combines with the others

- **WHEN** an authenticated owner filters to vacant rooms within one building
- **THEN** the response contains only that building's rooms with no running tenancy

#### Scenario: The tenancy's own details are not included

- **WHEN** an authenticated owner retrieves a room that is let
- **THEN** the response says that it is let without carrying the tenancy's terms, tenant, or dates

### Requirement: A room's opening reading counts as a known meter position

The system SHALL treat a room's recorded opening reading as one of the sources for that room's current meter position, alongside the reading a lease opened from, the reading a lease closed at, any reading already recorded on an invoice for that room, and any vacancy record. The most recent of them SHALL win.

Adding it as one more source rather than a special case is what makes it disappear from every later calculation. On a room that has been let, the tenancy's readings are newer and the opening figure is simply never the most recent. On a room that has never been let, it is the only one there is — which is the situation this exists for.

An invoiced reading is dated at the end of the period it billed, which is when the meter was read. Leaving it out made the room's position lag behind its own bills: a tenancy billed through September reported the reading it opened from in June, and the move-out screen offered that figure while the API refused anything below what September had already invoiced — the hint and the rule consulting different histories of one meter.

A room with no recorded opening reading and no tenancy history SHALL continue to report no known position, because it genuinely has none.

#### Scenario: A never-let room reports its opening reading

- **WHEN** a room was created with an opening reading and has never been let
- **THEN** its known meter position is that reading

#### Scenario: A tenancy's reading supersedes it

- **WHEN** a room created with an opening reading is later let, and that tenancy records readings of its own
- **THEN** the room's known position comes from the tenancy, because those readings are more recent

#### Scenario: A billed reading supersedes the one a tenancy opened from

- **WHEN** a running tenancy has been billed for a month, recording a closing reading on that invoice
- **THEN** the room's known position is that invoiced reading, not the reading the tenancy opened from

#### Scenario: What the screen offers is never below what the API will accept

- **WHEN** an owner is shown the room's known reading while recording a move-out
- **THEN** entering that figure is not refused for being below what has already been invoiced

#### Scenario: A room with nothing recorded at all

- **WHEN** a room has neither an opening reading nor any tenancy history
- **THEN** it reports no known meter position

#### Scenario: A room's first lease can default from it

- **WHEN** an authenticated owner creates the first lease for a room that has an opening reading, without supplying a starting reading
- **THEN** the lease starts from the room's recorded reading, rather than being refused for having nothing to fall back on

### Requirement: Rooms can be listed by the date they are free from

The system SHALL allow an authenticated `owner` to list rooms available on a NAMED DATE: rooms in service, holding no open tenancy, whose most recent tenancy ended on or before that date.

"Vacant" answers a different question — free right now — and it is the wrong question when signing. A room whose tenant leaves on the 30th can take a tenancy beginning the 1st, and a room free today cannot take one beginning last month. A caller that asks "which rooms are free now" while the owner is signing for November gets both answers wrong in the same list.

The date SHALL be compared the way the tenancy rule compares it: an ending date is the first day no longer covered, so a room whose previous tenancy ends exactly on the named date IS available — it abuts, with neither gap nor overlap.

A CANCELLED tenancy SHALL be ignored in this comparison. It covered no days, so its dates hold no room; counting them would hide the very room a cancellation was performed to free.

This filter SHALL be combinable with the others, and SHALL NOT change what the listing returns when it is not given.

#### Scenario: A room whose tenancy ends before the date

- **WHEN** an owner lists rooms available on a date after the room's last tenancy ended
- **THEN** that room is listed

#### Scenario: A room whose tenancy ends exactly on the date

- **WHEN** an owner lists rooms available on the very day the room's last tenancy ends
- **THEN** that room is listed, because an ending date is the first day no longer covered

#### Scenario: A room still let on that date

- **WHEN** an owner lists rooms available on a date while a tenancy of that room is still running
- **THEN** that room is not listed

#### Scenario: A room whose last tenancy ends after the date

- **WHEN** an owner lists rooms available on a date earlier than the day the room's last tenancy ends
- **THEN** that room is not listed

#### Scenario: A cancelled tenancy holds no room

- **WHEN** a room's only tenancy was cancelled
- **THEN** the room is listed as available on any date

#### Scenario: A retired room is never available

- **WHEN** an owner lists rooms available on a date
- **THEN** rooms taken out of service are not listed

#### Scenario: The filter is optional

- **WHEN** an owner lists rooms without naming a date
- **THEN** the listing behaves exactly as it did before

### Requirement: A let room names the tenancy holding it and when it frees up

A room reported as let SHALL also report the IDENTITY of the tenancy holding it and the day that tenancy covers to — the recorded move-out where there is one, the agreed end otherwise. A room that is not let SHALL report neither.

A room has said only WHETHER it is let, and deliberately: a room's response must not carry the tenancy's terms, its tenant or its rent, because that is the tenancy's own record and a copy of it goes stale on the first change.

An identifier and a date are not that copy. They are the two things a rooms screen cannot answer without them — "when does this room come free" and "which tenancy is in it" — and the alternative is a request per row, which is what a listing exists to avoid.

Nothing further SHALL be added. No tenant name, no rent, no status of the tenancy: each is available by following the id, and each would be a second place for a fact that already has one.

#### Scenario: A let room reports its tenancy

- **WHEN** an authenticated owner retrieves a room with a running tenancy
- **THEN** the response names that tenancy's id and the day it covers to

#### Scenario: A tenancy that ended early

- **WHEN** the tenancy holding a room recorded a move-out before its agreed end
- **THEN** the room reports the move-out date, because that is the day it comes free

#### Scenario: A vacant room reports neither

- **WHEN** an authenticated owner retrieves a room with no running tenancy
- **THEN** the response carries no tenancy id and no end date

#### Scenario: Listed rooms report it too

- **WHEN** an authenticated owner lists rooms
- **THEN** each let room carries the same two facts it carries when retrieved singly

#### Scenario: Nothing else comes with it

- **WHEN** a room reports the tenancy holding it
- **THEN** it carries no tenant, no rent and no terms from that tenancy

### Requirement: A tenancy reports the floor its closing reading must clear

A tenancy SHALL report where its own invoices leave the meter: the reading its most recent invoice closed at, or the reading the tenancy opened from when nothing has been billed yet.

It SHALL be resolved by the same rule the API refuses a closing reading below, so that the figure a screen offers and the figure the API accepts are one value rather than two. The screen previously offered the ROOM's last known position, which ignores the tenancy's own bills — an owner was shown 1.411, entered 1.500, and was refused because September had already invoiced 1.750.

A screen asking for a closing reading SHALL state that floor, and SHALL refuse a lower figure before sending it.

#### Scenario: The figure offered is the figure enforced

- **WHEN** the owner opens the move-out or renewal dialog for a tenancy that has been billed
- **THEN** it states the reading already invoiced, and that a lower one cannot be entered

#### Scenario: A lower reading is refused on the screen

- **WHEN** the owner types a reading below what has been invoiced
- **THEN** the field says so and the action cannot be submitted

#### Scenario: A tenancy with no bills yet

- **WHEN** the tenancy has not been billed at all
- **THEN** the floor is the reading it opened from
