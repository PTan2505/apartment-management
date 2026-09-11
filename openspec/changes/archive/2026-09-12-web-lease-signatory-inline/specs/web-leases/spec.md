## ADDED Requirements

### Requirement: The person responsible can be created while signing

The application SHALL let the owner name the person responsible by typing, offering existing customers that match as they type, and SHALL let them add somebody the list does not have without leaving the form.

Leaving the form is not a small cost: the owner loses what they have already filled in, and the tenancy they were signing has to be started again. A tenant signing their first lease is the ordinary case, so the ordinary case was the one that required a detour.

Choosing an existing person SHALL behave exactly as choosing from a list does today.

Where the owner adds a new person, a phone number SHALL be required. It is the only value the system recognises a returning tenant by, and a person recorded without one becomes a second record of the same name the next time they rent. This requirement applies where somebody is taking responsibility for a tenancy; it does not change what the customers screen asks for.

#### Scenario: Choosing somebody already on file

- **WHEN** the owner types part of a name and picks a suggestion
- **THEN** that person is the signatory, as if they had been chosen from a list

#### Scenario: Adding somebody new

- **WHEN** the owner types a name the list does not have, supplies a phone number, and signs
- **THEN** the person is created and the tenancy is signed to them, without the form being left

#### Scenario: A new person with no phone number

- **WHEN** the owner tries to add a new person without a phone number
- **THEN** the form refuses, and says why the number is needed

### Requirement: A phone number that belongs to somebody else stops the signing

Where the owner supplies a phone number that already belongs to a person on file, the application SHALL show whose it is and SHALL NOT sign the tenancy until the owner has chosen.

The system matches on the phone number and keeps the name it already holds; the typed name is discarded. Proceeding would attach the tenancy to a person whose name the owner never entered, and it is worst in the case that looks most ordinary — a returning tenant whose name is spelled slightly differently.

It cannot be caught afterwards by comparing the name returned against the name typed, because those agree precisely when the existing person happens to share the name.

The owner SHALL be able to accept the matched person and continue, or go back and change what they entered.

#### Scenario: The number belongs to a returning tenant

- **WHEN** the owner enters a name and a phone number already held by another customer
- **THEN** the screen shows who holds it and waits, rather than signing

#### Scenario: Accepting the match

- **WHEN** the owner confirms that the matched person is who they meant
- **THEN** the tenancy is signed to that person, under the name already on file

#### Scenario: The number belongs to an owner account

- **WHEN** the phone number belongs to an owner rather than a customer
- **THEN** the refusal says so, and no person is created
