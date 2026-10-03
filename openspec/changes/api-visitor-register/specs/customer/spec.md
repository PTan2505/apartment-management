## MODIFIED Requirements

### Requirement: Owner can register a customer
The system SHALL allow an authenticated `owner` to register a person by full name, with an optional phone number and an optional identity-document number. The person SHALL be stored with the `customer` role and no password, and SHALL NOT be able to log in. A phone number is optional because occupants such as children may not have one, while still needing a stable identity.

The identity-document number SHALL be the number as text, alongside — not instead of — the photographs of the card. The photographs are what proves the document; the number is what gets typed into a form, and a system holding only pictures cannot fill one in. It is optional because every customer recorded before it existed has none, and because an owner entering a tenancy from an old paper file may never have been given it.

#### Scenario: Registering a person with a phone number
- **WHEN** an authenticated owner registers a person with a full name and a phone number not already in the system
- **THEN** the system creates a `customer` user with no password and responds with HTTP 201 and the customer record

#### Scenario: Registering a person without a phone number
- **WHEN** an authenticated owner registers a person with a full name and no phone number
- **THEN** the system creates a `customer` user with no phone and responds with HTTP 201

#### Scenario: Registering a phone number that already belongs to a customer
- **WHEN** an authenticated owner registers a person using a phone number that already belongs to an existing customer
- **THEN** the system returns the existing customer with HTTP 200 instead of creating a duplicate, so the same person can appear across several leases over time

#### Scenario: Multiple people without phone numbers
- **WHEN** an authenticated owner registers two different people, neither with a phone number
- **THEN** the system creates two separate customer records, because absent phone numbers cannot be used to recognise the same person

#### Scenario: Phone number already belongs to an owner account
- **WHEN** an authenticated owner registers a person using a phone number that belongs to an `owner` account
- **THEN** the system responds with HTTP 409 and does not modify that account

#### Scenario: Missing full name
- **WHEN** an authenticated owner submits a request without a full name
- **THEN** the system responds with HTTP 400 identifying the invalid input

#### Scenario: Registering with an identity-document number
- **WHEN** an authenticated owner registers a person with a full name and an identity-document number
- **THEN** the system records the number on the customer and responds with HTTP 201

#### Scenario: Registering without an identity-document number
- **WHEN** an authenticated owner registers a person with no identity-document number
- **THEN** the system creates the customer with none recorded, and responds with HTTP 201

### Requirement: Owner can update a customer
The system SHALL allow an authenticated `owner` to update a customer's full name, phone number and identity-document number, including adding any of them to a record that had none. A phone number already in use by a different user SHALL be rejected.

A customer SHALL remain findable by their current name. Searching by a name that has been changed SHALL find the customer by the new name and SHALL NOT find them by the old one.

An identity-document number SHALL be clearable, because a number entered against the wrong person is worse than an absent one — it is the box that gets copied onto a government form without being re-checked.

#### Scenario: Successful update
- **WHEN** an authenticated owner updates an existing customer with valid values
- **THEN** the system saves the changes and responds with HTTP 200 and the updated customer

#### Scenario: Adding a phone number to a customer who had none
- **WHEN** an authenticated owner sets a previously absent phone number on a customer, and that number is not in use
- **THEN** the system saves the change and responds with HTTP 200

#### Scenario: Updating to a phone number already in use
- **WHEN** an authenticated owner updates a customer's phone number to one already belonging to another user
- **THEN** the system responds with HTTP 409 and does not apply the change

#### Scenario: A renamed customer is found by their new name
- **WHEN** an authenticated owner changes a customer's full name and then searches for the new name, written without diacritics
- **THEN** the response contains that customer

#### Scenario: A renamed customer is not found by their old name
- **WHEN** an authenticated owner changes a customer's full name and then searches for the previous name
- **THEN** the response does not contain that customer

#### Scenario: Adding an identity-document number to a customer who had none
- **WHEN** an authenticated owner sets a previously absent identity-document number on a customer
- **THEN** the system saves the change and responds with HTTP 200

#### Scenario: Clearing an identity-document number
- **WHEN** an authenticated owner clears a customer's identity-document number
- **THEN** the system saves the change and the customer carries none
