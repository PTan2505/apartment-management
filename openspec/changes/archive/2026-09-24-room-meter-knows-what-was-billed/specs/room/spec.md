## MODIFIED Requirements

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

## ADDED Requirements

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
