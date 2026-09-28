## ADDED Requirements

### Requirement: The portal shows the reports raised from it

The portal SHALL return the damage reports of the tenancy the token was issued
for, each carrying what was reported, its state, and the appointment agreed with
the tenant where there is one.

It SHALL NOT carry who among the staff recorded or closed it. A tenant needs to
know somebody is coming and when, not the staffing of the building.

#### Scenario: A tenant checks a report

- **WHEN** a tenant opens their portal link after reporting something
- **THEN** they see the report, its state, and the appointment if one has been agreed

#### Scenario: Only their own tenancy's

- **WHEN** a tenant opens the portal
- **THEN** no report of any other tenancy appears

#### Scenario: Nothing reported

- **WHEN** a tenancy has raised no reports
- **THEN** the portal says so rather than showing an empty area
