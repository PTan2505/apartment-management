## Purpose

The owner's screens for what a building costs them: recording a cost, correcting one, and closing off a month's empty rooms whose electricity nobody was billed for. Costs are the half of the revenue report that has no way in, so every figure it produces is too flattering until this exists.

## Requirements

### Requirement: The owner can record what a building cost them

The application SHALL let the owner record a cost against a building, and optionally against a room within it.

Without this the revenue report subtracts nothing, and reports a profit that has had none of the month's spending taken out of it. That is not a gap a reader can allow for, because its size is unknowable from the report itself.

Where a cost is measured — units at a rate — the application SHALL take the quantity and the rate and let the amount follow from them, rather than asking for all three. An amount typed beside the numbers it came from is an amount that can disagree with them, and the disagreement is invisible afterwards.

Where a cost is not measured, the application SHALL take the amount directly. Most spending is a figure on a receipt, and forcing it into a quantity and a rate would invent a basis nobody has.

The application SHALL require a description. A cost with a category and an amount but no account of what it was for cannot be checked against anything months later.

#### Scenario: Recording a cost

- **WHEN** the owner records a cost against a building, with a kind, a description, a date and an amount
- **THEN** it is saved and appears among that building's costs

#### Scenario: A cost against one room

- **WHEN** the owner records a cost against a particular room
- **THEN** it is saved against that room as well as its building

#### Scenario: A measured cost

- **WHEN** the owner enters a quantity and a rate
- **THEN** the amount follows from them rather than being asked for separately

#### Scenario: An unmeasured cost

- **WHEN** the owner enters an amount without a quantity or rate
- **THEN** it is saved as entered

### Requirement: The owner can close off a month's empty rooms

The application SHALL present, for a chosen month and building, every room that stood empty at that month's end and has no electricity recorded for it, as one list the owner works down.

This is the cost an owner does not know is missing. A room stands empty, its meter runs, nobody is billed, and nothing anywhere asks about it — so it is never recorded, and the month's costs are understated by an amount nobody can name afterwards.

**What remains on the list SHALL be what remains to be done.** A room leaves it once its reading is recorded. That is the answer to "which empty rooms have I not done", given by the shape of the screen rather than by a warning that has to be noticed.

The application SHALL show the reading each room's electricity opens from, beside the field taking the new one. A meter reading means nothing alone — what is charged is the difference — so a plausible typo is indistinguishable from a correct figure without it.

Where nothing is outstanding, the application SHALL say the month is done rather than showing an empty table.

#### Scenario: The month's outstanding rooms are listed

- **WHEN** the owner opens the empty-rooms screen for a month
- **THEN** every room that stood empty at that month's end without electricity recorded is listed, each showing the reading it opens from

#### Scenario: A recorded room leaves the list

- **WHEN** the owner records a room's reading
- **THEN** it is no longer listed, so what remains is what is still to be done

#### Scenario: A reading below the one it opens from

- **WHEN** the owner enters a reading lower than the one the room opens from
- **THEN** the screen says so before it is recorded, because the difference is what gets charged

#### Scenario: Nothing outstanding

- **WHEN** every empty room has been recorded for that month
- **THEN** the screen says the month is done, rather than showing an empty table

### Requirement: The owner can find, correct and remove costs

The application SHALL let the owner narrow costs by building, by room, by kind, and by date range, and SHALL let them correct or remove one.

A mistyped meter reading produces a cost that is wrong by an arbitrary amount, and the system deliberately allows even a system-recorded cost to be corrected for exactly that reason. A screen that could record costs but not fix them would leave the owner's only recourse outside the application.

Removing a cost SHALL be presented as removing it outright, because that is what happens — unlike a withdrawn invoice, which is kept as a record. The two behave differently and the screen SHALL NOT suggest otherwise.

#### Scenario: Narrowing to a building and a period

- **WHEN** the owner filters costs by building and a date range
- **THEN** only costs for that building within that range are listed

#### Scenario: Correcting a cost

- **WHEN** the owner corrects a cost's amount, kind, description or date
- **THEN** the change is saved

#### Scenario: Correcting a cost the system recorded

- **WHEN** the owner corrects a cost the system recorded from a meter reading
- **THEN** the change is saved, because a mistyped reading has to be correctable after the fact

#### Scenario: Removing a cost

- **WHEN** the owner removes a cost
- **THEN** it is gone from every listing and total, and the screen says it is removed rather than withdrawn

### Requirement: A cost the system recorded is distinguishable

The application SHALL show whether a cost was recorded by the system or entered by the owner.

They are equally correctable but not equally expected. An owner scanning their spending needs to know that an electricity cost they never entered came from a room standing empty, rather than wondering who put it there.

#### Scenario: A system-recorded cost is marked

- **WHEN** the owner views a cost the system recorded from a vacant room's meter
- **THEN** it is shown as system-recorded, distinct from one they entered

### Requirement: The cost screens adapt to the viewport

The application SHALL present these screens on a phone as usably as on a desktop.

The month-end round is the case that matters, for the same reason as billing: an owner may be entering readings while standing in the building.

#### Scenario: Entering readings on a phone

- **WHEN** the owner opens the empty-rooms screen on a narrow viewport
- **THEN** each room and its reading field are reachable without scrolling the page sideways
