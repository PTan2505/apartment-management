## ADDED Requirements

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
