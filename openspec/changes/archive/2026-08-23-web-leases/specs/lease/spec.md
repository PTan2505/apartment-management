## ADDED Requirements

### Requirement: A lease reports the room it is for

Every lease the system returns SHALL report its room — the room's id, its code, and the building that room belongs to, identified by id and display name — and SHALL do so identically whether the lease is listed or retrieved on its own.

A lease reporting only a room id cannot be shown. A room code identifies a room only within its building, so a code without its building is ambiguous; and an id without either is not something a reader can act on. Without this, listing twenty tenancies means twenty further requests, or fetching every room and joining them by hand — which is wrong the moment there are more rooms than fit in one page.

The reported room SHALL be limited to what identifies it. Its rent, its status, and whether it is let SHALL NOT be included: those belong to the room's own representation, and a lease's own agreed rent is a different figure that must not be confused with the room's.

#### Scenario: A retrieved lease reports its room

- **WHEN** an authenticated owner retrieves a lease
- **THEN** the response carries the room's id and code, and the building that room belongs to, identified by id and display name

#### Scenario: A listed lease reports its room

- **WHEN** an authenticated owner lists leases
- **THEN** each carries its room in the same form as when retrieved singly

#### Scenario: The room's own figures are not included

- **WHEN** an authenticated owner retrieves a lease
- **THEN** the reported room does not carry the room's rent, its status, or whether it is let

#### Scenario: The lease's rent is its own

- **WHEN** a room's base rent is changed after a lease on it was created
- **THEN** the lease still reports its own agreed rent, and the room reported alongside carries no rent to disagree with it

### Requirement: A finished tenancy still reports who was responsible for it

A lease that has recorded a move-out SHALL report the person who was responsible for it when it ended, even though that person is no longer a current occupant.

Recording a move-out departs every occupant, so a finished tenancy has nobody currently responsible — and reporting the tenant as absent erases the one name the record exists to hold. The question asked of a closed tenancy, months later, is who was renting the room; a record that cannot answer it has lost its point.

**A tenancy that is still running SHALL NOT fall back in this way.** There, no current responsible occupant means the last one left before a move-out was recorded and nobody is answerable for the agreement right now. That is a real state needing attention, and naming somebody who has left would conceal it.

#### Scenario: A finished tenancy names who held it

- **WHEN** an authenticated owner retrieves a lease whose move-out has been recorded
- **THEN** the response reports the person who was responsible for it when it ended

#### Scenario: Responsibility transferred before the end

- **WHEN** responsibility was transferred during a tenancy that has since ended
- **THEN** the person reported is the one who held it at the end, not the one who held it first

#### Scenario: A running tenancy with nobody responsible reports nobody

- **WHEN** an authenticated owner retrieves a running lease whose responsible occupant has departed and which has no move-out recorded
- **THEN** the response reports no tenant, rather than the person who left

### Requirement: A lease reports the date its tenancy ended

A lease that has recorded a move-out SHALL report that date, alongside the status derived from it. A lease still running SHALL report no such date.

The system already holds this and already treats it as significant: it is deliberately not constrained by the agreed term, precisely so that a tenant who stayed on can be recorded as they actually left. But the date reaches no caller — only a status saying the tenancy is over, which cannot say when, and cannot distinguish a tenancy that ran its term from one closed early or late. The record was able to say so and was not asked.

The date SHALL be exclusive in the same way as the expected end date: the first day the tenancy no longer covers. Reporting one of the two dates on each convention would guarantee that somebody eventually reads them the same way.

#### Scenario: A finished tenancy reports when it ended

- **WHEN** an authenticated owner retrieves a lease whose move-out was recorded as 2026-07-05
- **THEN** the response reports that date, and reports the lease as finalized

#### Scenario: A running tenancy reports no ending

- **WHEN** an authenticated owner retrieves a lease with no move-out recorded
- **THEN** the response reports no move-out date, and reports the lease as active

#### Scenario: A tenancy that ran past its term is distinguishable

- **WHEN** an authenticated owner retrieves a lease whose move-out was recorded after its expected end date
- **THEN** both dates are reported, so what was agreed and what happened can be told apart

## MODIFIED Requirements

### Requirement: Owner can list, filter, and retrieve leases

The system SHALL allow an authenticated `owner` to retrieve a lease by id and to list leases filtered by room, **by building**, by the people who have occupied them, by whether they are active, and by whether their agreed term has run out without a move-out being recorded.

Filtering by building exists because a room code identifies a room only within its building, so an owner holding several buildings cannot pick a room without first knowing which building it is in. Naming the rooms of a building one at a time is not a substitute: it is the caller reconstructing a grouping the system already holds. Listing SHALL be paginated using the shared paginated response contract, so the response carries a `data` array and a `meta` object describing the page and totals rather than a bare array.

**Leases SHALL be listed most recently begun first.** The tenancy an owner has just signed, or is about to act on, is the recent one; ordering oldest-first puts it on the last page and makes the common case the hardest to reach. Where two leases begin on the same day, the more recently recorded SHALL come first, so the order is total and a lease cannot move between pages.

A lease whose term has ended while no move-out is recorded SHALL be findable, because it needs attention: no further invoice can be issued for it, and its room stays held against a new tenancy until it is closed or renewed. Leaving such a lease discoverable only by inspecting each room in turn would make a state the system creates a state the owner cannot act on.

This filter SHALL be combinable with the others, and SHALL be judged against the same exclusive reading of the term as billing uses.

#### Scenario: Leases are listed most recently begun first

- **WHEN** an authenticated owner lists leases
- **THEN** the lease with the most recent start date appears first

#### Scenario: Leases beginning on the same day have a stable order

- **WHEN** two leases share a start date
- **THEN** the more recently recorded appears first, and neither moves between pages as the list is paged through

#### Scenario: Filtering to active leases
- **WHEN** an authenticated owner lists leases filtered to active ones
- **THEN** the response contains only leases with no move-out date

#### Scenario: Filtering to leases whose term has run out
- **WHEN** an authenticated owner lists leases filtered to those whose term has ended without a move-out
- **THEN** the response contains only leases with no move-out date whose agreed term has already ended

#### Scenario: A lease still within its term is not listed as overdue
- **WHEN** an authenticated owner filters to overdue leases and a lease with no move-out is still inside its agreed term
- **THEN** that lease is not included

#### Scenario: A closed lease is not listed as overdue
- **WHEN** an authenticated owner filters to overdue leases and a lease whose term ended has since recorded a move-out
- **THEN** that lease is not included, because it needs no attention

#### Scenario: The overdue filter combines with the others
- **WHEN** an authenticated owner filters to overdue leases within a particular room
- **THEN** the response contains only that room's leases matching both conditions

#### Scenario: Filtering by building

- **WHEN** an authenticated owner lists leases filtered by a building id
- **THEN** the response contains every lease for a room in that building, and none for a room elsewhere

#### Scenario: Building and room together

- **WHEN** an authenticated owner filters by both a building and a room in it
- **THEN** the response contains that room's leases

#### Scenario: Filtering by person
- **WHEN** an authenticated owner lists leases filtered by a customer id
- **THEN** the response contains every lease that person has occupied, whether as primary occupant or not, including finalized ones

#### Scenario: Retrieving a lease that does not exist
- **WHEN** an authenticated owner requests a lease id that does not exist
- **THEN** the system responds with HTTP 404

#### Scenario: Lease listing is paginated
- **WHEN** an authenticated owner lists leases
- **THEN** the response is the shared paginated shape, with the leases in `data` and the page, page size, and totals in `meta`

#### Scenario: Paging applies to filtered leases
- **WHEN** an authenticated owner lists leases filtered to active ones and asks for a specific page
- **THEN** the items and totals describe only the active leases
