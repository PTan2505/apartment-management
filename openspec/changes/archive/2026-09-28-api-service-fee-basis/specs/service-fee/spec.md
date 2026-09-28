## ADDED Requirements

### Requirement: A fee states what it is charged per

A building service fee SHALL record whether it is charged `perRoom` or `perPerson`.

`perRoom` is the existing behaviour: one amount, multiplied by the quantity a tenancy
holds. `perPerson` is charged against the tenancy's occupant count instead, and a
tenancy SHALL NOT be asked for a quantity when taking one up — the head count IS the
quantity, and accepting both would multiply twice.

It SHALL default to `perRoom` where not supplied, which is what every fee recorded
before this existed already is.

The basis SHALL be copied onto a tenancy's selection at the moment it is taken up,
alongside the unit amount that is already copied. Changing a fee from one basis to the
other therefore reaches only tenancies that take it up afterwards — the same rule that
already governs its price, for the same reason.

#### Scenario: Defining a per-person fee

- **WHEN** the owner defines a fee charged per person
- **THEN** it records that basis, and tenancies taking it up are charged against their occupant count

#### Scenario: A fee defined without saying

- **WHEN** the owner defines a fee without stating what it is charged per
- **THEN** it records `perRoom`

#### Scenario: A quantity on a per-person fee

- **WHEN** a tenancy takes up a per-person fee supplying a quantity
- **THEN** the system responds with HTTP 400 and nothing is attached, because the head count already decides the multiplier

#### Scenario: Changing the basis later

- **WHEN** the owner changes an offered fee from per-room to per-person
- **THEN** tenancies already holding it keep being charged as they agreed, and only tenancies taking it up afterwards use the new basis

### Requirement: A fee can be applied to new tenancies by default

A building service fee SHALL record whether it applies to new tenancies automatically.

Creating a tenancy SHALL take up every fee its building offers that is marked so, at the
price and basis current at that moment, effective from the tenancy's start date. Each
SHALL be an ordinary selection afterwards: it can have its quantity changed, and it can
be stopped on that one tenancy.

It SHALL default to off.

Marking a fee this way SHALL NOT change any tenancy that already exists. It states what
is agreed from now on; charging a running tenancy for something never agreed with that
tenant is not a default, it is a new charge.

A fee that is retired SHALL NOT be applied, whatever this says.

#### Scenario: Signing a tenancy in a building with default fees

- **WHEN** a tenancy is created in a building offering two fees marked as applying by default
- **THEN** the tenancy holds both, effective from its start date, at the prices current when it was signed

#### Scenario: Existing tenancies are left alone

- **WHEN** the owner marks a fee as applying by default
- **THEN** no tenancy that already exists gains it

#### Scenario: Taking a default fee off one tenancy

- **WHEN** a tenancy that picked up a default fee stops it
- **THEN** it stops for that tenancy only, and later tenancies still pick it up

#### Scenario: A retired fee marked as default

- **WHEN** a tenancy is created in a building whose default fee has been retired
- **THEN** the tenancy does not pick it up
