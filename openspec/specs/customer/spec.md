## Purpose

Lets an owner register and look up the people who rent or occupy rooms, stored as `customer`-role users so the same person keeps one identity across every lease and room they appear in.

## Requirements

### Requirement: Owner can register a customer
The system SHALL allow an authenticated `owner` to register a person by full name, with an optional phone number. The person SHALL be stored with the `customer` role and no password, and SHALL NOT be able to log in. A phone number is optional because occupants such as children may not have one, while still needing a stable identity.

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

### Requirement: Owner can list and retrieve customers
The system SHALL allow an authenticated `owner` to list customers and retrieve a single customer by id. Customer records SHALL never expose password material.

#### Scenario: Listing customers
- **WHEN** an authenticated owner lists customers
- **THEN** the response contains only `customer`-role users and excludes `owner` accounts

#### Scenario: Retrieving a customer that does not exist
- **WHEN** an authenticated owner requests a customer id that does not exist
- **THEN** the system responds with HTTP 404

#### Scenario: Password material is never returned
- **WHEN** an authenticated owner lists or retrieves customers
- **THEN** no response includes a password or password hash field

### Requirement: Owner can update a customer
The system SHALL allow an authenticated `owner` to update a customer's full name and phone number, including adding a phone number to a record that had none. A phone number already in use by a different user SHALL be rejected.

#### Scenario: Successful update
- **WHEN** an authenticated owner updates an existing customer with valid values
- **THEN** the system saves the changes and responds with HTTP 200 and the updated customer

#### Scenario: Adding a phone number to a customer who had none
- **WHEN** an authenticated owner sets a previously absent phone number on a customer, and that number is not in use
- **THEN** the system saves the change and responds with HTTP 200

#### Scenario: Updating to a phone number already in use
- **WHEN** an authenticated owner updates a customer's phone number to one already belonging to another user
- **THEN** the system responds with HTTP 409 and does not apply the change

### Requirement: Customer endpoints require an authenticated owner
The system SHALL reject any customer request that is unauthenticated or made by a user whose role is not `owner`.

#### Scenario: Unauthenticated request
- **WHEN** a request to any customer endpoint has no valid access token
- **THEN** the system responds with HTTP 401 and does not process the request

#### Scenario: Authenticated non-owner request
- **WHEN** a request to any customer endpoint carries a valid access token for a user whose role is not `owner`
- **THEN** the system responds with HTTP 403 and does not process the request
