## ADDED Requirements

### Requirement: The owner manages what a building charges beside rent

A building's page SHALL let the owner add a service fee, change its name and price,
retire it, and bring a retired one back. Each fee SHALL show its name and its monthly
price.

The page SHALL say that setting a fee here charges nobody by itself — a tenancy has to
take it up — because a list of fees is otherwise indistinguishable from a list of
charges, and an owner would reasonably assume their tenants were already being billed.

Repricing SHALL be described as reaching only tenancies that take the fee up
afterwards. A tenancy that already has it holds its own copy of the price.

A retired fee SHALL remain visible to the owner, set apart from the ones still offered,
because it can be brought back and because tenancies may still be billed for it.

Only the owner SHALL be offered any of these controls. A manager SHALL see the same
fees and no way to change them.

#### Scenario: Adding a fee

- **WHEN** the owner adds a fee with a name and a monthly price
- **THEN** it appears in the building's list without a reload, and is offered to tenancies in that building

#### Scenario: A name the building already uses

- **WHEN** the owner adds a fee whose name an offered fee already has
- **THEN** the form stays open, says the name is taken, and nothing is created

#### Scenario: Retiring a fee

- **WHEN** the owner retires a fee, after being told that tenancies already holding it keep being charged
- **THEN** it moves to the retired group and is no longer offered to new tenancies

#### Scenario: Bringing one back

- **WHEN** the owner restores a retired fee
- **THEN** it is offered again

#### Scenario: A manager reads the catalogue

- **WHEN** a manager opens a building's page
- **THEN** the fees and their prices are shown, and nothing offers to add, change or retire one

#### Scenario: A building with no fees

- **WHEN** a building has no service fees
- **THEN** the page says so, and invites the owner to add one
