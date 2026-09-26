## ADDED Requirements

### Requirement: Damage reports have a screen the building's staff work from

The application SHALL give staff and the owner a screen listing damage reports,
oldest open first, each showing the room and building, what the tenant said,
when it was raised, its state, and the appointment where one has been agreed.

It SHALL be filterable by state, and by building for anyone covering more than
one.

Opening a report SHALL show the tenant's name and phone number, so the person
handling it can ring them from what is in front of them.

#### Scenario: What a maintenance worker sees on arrival

- **WHEN** a maintenance account signs in
- **THEN** the damage reports of its buildings are the screen it arrives at, oldest open first

#### Scenario: Reaching the tenant

- **WHEN** staff open a report
- **THEN** the tenant's name and phone number are shown with it

#### Scenario: Nothing outstanding

- **WHEN** no report is open
- **THEN** the screen says so rather than showing an empty list

### Requirement: Staff record the appointment and close the report

The screen SHALL let staff record the date and time agreed with the tenant, with
a note of what was agreed, and SHALL show that appointment on the report
afterwards.

It SHALL let them close a report with a note of what was done, from either
state, and SHALL confirm before closing — a closed report cannot be reopened.

A report that is done SHALL offer neither action, and SHALL say when it was
closed and what was done.

#### Scenario: Recording an appointment

- **WHEN** staff record an appointment on a new report
- **THEN** the report shows it as scheduled, with that date

#### Scenario: Closing

- **WHEN** staff close a report and confirm
- **THEN** it reads as done, with the note and the date it was closed

#### Scenario: A closed report

- **WHEN** staff open a report that is done
- **THEN** no action is offered, and the closing note is shown

### Requirement: Each role arrives where its work is, and is offered only that

The application SHALL send each role to its own starting screen — the owner to
buildings, a manager to tenancies, maintenance to damage reports — and SHALL
show in the navigation only what that role may reach.

For the `owner` that is everything: every screen this application has, including
the damage reports and the staff screen. Filtering the navigation by role must
not become a way for a screen to go missing from the one account that is meant
to see all of them.

A manager's navigation SHALL NOT carry the revenue report or the staff screen.
Offering a destination that will refuse the person is worse than not offering
it: they cannot tell a permission from a fault.

Where a role's data is narrowed to its buildings, the screen SHALL say which
buildings those are, so a short list reads as a scope rather than as missing
records.

#### Scenario: A manager signs in

- **WHEN** a manager signs in
- **THEN** they arrive at the tenancy list, narrowed to their buildings, with the buildings they cover named

#### Scenario: What a manager is not offered

- **WHEN** a manager reads the navigation
- **THEN** it carries no revenue report and no staff screen

#### Scenario: Maintenance signs in

- **WHEN** a maintenance account signs in
- **THEN** it arrives at the damage reports, and the navigation offers nothing else

#### Scenario: The owner is offered everything

- **WHEN** the owner reads the navigation
- **THEN** it carries every screen in the application, including the damage reports, and nothing is hidden from them

#### Scenario: Typing an address they may not reach

- **WHEN** a manager navigates directly to the revenue report
- **THEN** the application says the screen is not theirs and offers the way back, rather than showing a failed request
