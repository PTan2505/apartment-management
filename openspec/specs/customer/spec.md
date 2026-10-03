## Purpose

Lets an owner register and look up the people who rent or occupy rooms, stored as `customer`-role users so the same person keeps one identity across every lease and room they appear in.
## Requirements
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

### Requirement: Owner can list and retrieve customers
The system SHALL allow an authenticated `owner` to list customers, search them, and retrieve a single customer by id. Customer records SHALL never expose password material. Listing SHALL be paginated using the shared paginated response contract, so the response carries a `data` array and a `meta` object describing the page and totals rather than a bare array.

The search SHALL match a customer whose full name or phone number contains the given text, so that one field serves both looking someone up by name and looking them up by the number they gave.

Name matching SHALL ignore letter case and diacritical marks. A Vietnamese name is routinely typed without its diacritics, and a search that demands them finds nothing while the customer plainly exists. Searching `nguyen van a` SHALL therefore find `Nguyễn Văn A`, as SHALL `NGUYEN VAN A` and `Nguyễn Văn A` itself.

Phone matching SHALL remain exact. A phone number's characters are all significant and none has a case or a diacritic, so folding them could only introduce false matches.

The caller SHALL NOT be required to normalise the search text before sending it. A search SHALL behave identically whether or not the caller lowercased or stripped diacritics from it first.

The normalised form used for matching SHALL NOT appear in any response. It exists to make searching work and is not part of the customer's representation.

#### Scenario: Listing customers
- **WHEN** an authenticated owner lists customers
- **THEN** the response contains only `customer`-role users and excludes `owner` accounts

#### Scenario: Retrieving a customer that does not exist
- **WHEN** an authenticated owner requests a customer id that does not exist
- **THEN** the system responds with HTTP 404

#### Scenario: Password material is never returned
- **WHEN** an authenticated owner lists or retrieves customers
- **THEN** no response includes a password or password hash field

#### Scenario: Customer listing is paginated
- **WHEN** an authenticated owner lists customers
- **THEN** the response is the shared paginated shape, with the customers in `data` and the page, page size, and totals in `meta`

#### Scenario: Searching by part of a name
- **WHEN** an authenticated owner searches customers by text that a customer's full name contains
- **THEN** the response contains that customer

#### Scenario: Searching a name without diacritics
- **WHEN** an authenticated owner searches customers for `nguyen van a` and a customer is recorded as `Nguyễn Văn A`
- **THEN** the response contains that customer

#### Scenario: Searching a name in upper case
- **WHEN** an authenticated owner searches customers using upper-case text, including Vietnamese letters outside the plain Latin alphabet
- **THEN** the response contains the customers whose names match, unaffected by the casing used

#### Scenario: Searching a name containing đ
- **WHEN** an authenticated owner searches customers for `duc` and a customer is recorded with `Đức` in their name
- **THEN** the response contains that customer

#### Scenario: The caller does not normalise the search text
- **WHEN** an authenticated owner searches customers with the text exactly as a person typed it, without lowercasing or stripping diacritics
- **THEN** the result is the same as if the text had been normalised first

#### Scenario: Searching by phone number
- **WHEN** an authenticated owner searches customers by text that a customer's phone number contains
- **THEN** the response contains that customer

#### Scenario: Search with no match
- **WHEN** an authenticated owner searches by text that no customer's name or phone contains
- **THEN** the system responds with HTTP 200 and an empty list

#### Scenario: The normalised name is not exposed
- **WHEN** an authenticated owner lists or retrieves customers
- **THEN** no response includes the normalised form of the name, only the name as it was entered

#### Scenario: Paging applies to searched results
- **WHEN** an authenticated owner searches customers and asks for a specific page
- **THEN** the items and totals describe only the customers matching the search

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

### Requirement: Customer endpoints require an authenticated owner
The system SHALL reject any customer request that is unauthenticated or made by a user whose role is not `owner`.

#### Scenario: Unauthenticated request
- **WHEN** a request to any customer endpoint has no valid access token
- **THEN** the system responds with HTTP 401 and does not process the request

#### Scenario: Authenticated non-owner request
- **WHEN** a request to any customer endpoint carries a valid access token for a user whose role is not `owner`
- **THEN** the system responds with HTTP 403 and does not process the request

### Requirement: A customer can carry the two sides of their ID card
The system SHALL allow an authenticated `owner` to keep a photograph of each side of a customer's ID card, front and back, held in object storage and recorded on the customer as a reference rather than as bytes in the database.

Each side SHALL be independent: one may be on file without the other, and replacing one SHALL NOT disturb the other.

The images SHALL be uploaded directly from the browser to storage, following the same three steps the signed contract uses — the API signs a URL for one object of one content type, the browser uploads, and the API records the result — so that image bytes never pass through the API.

The API SHALL accept only the content types a photograph plausibly arrives as, SHALL refuse a file above a stated size ceiling and SHALL delete an over-sized upload rather than leave it in storage unreferenced, and SHALL verify that a key offered for recording lies under that customer's own prefix, so a confirmation cannot attach another customer's image — or any other object — to this one.

Reading an image back SHALL be through a short-lived signed URL. An ID card identifies a person; a link to one that does not expire is a link that can be forwarded indefinitely.

Removing a side SHALL clear the record and delete the stored object.

Where storage is not configured, these operations SHALL refuse in those terms, as the contract endpoints already do, and the rest of the customer record SHALL remain usable.

#### Scenario: Recording one side
- **WHEN** an authenticated owner uploads the front of a customer's ID card and confirms it
- **THEN** the customer records that image, and the back is unaffected

#### Scenario: Replacing one side
- **GIVEN** a customer with both sides on file
- **WHEN** the owner uploads a new front
- **THEN** the customer records the new front, the previous front is deleted from storage, and the back is unchanged

#### Scenario: A key belonging to somebody else
- **WHEN** an owner confirms a key that does not lie under that customer's prefix
- **THEN** the system responds with HTTP 400 and records nothing

#### Scenario: A file above the ceiling
- **WHEN** an owner confirms an upload larger than the ceiling
- **THEN** the system responds with HTTP 400, records nothing, and the object is deleted from storage

#### Scenario: An upload that never arrived
- **WHEN** an owner confirms a key with no object behind it
- **THEN** the system responds with HTTP 400 saying the upload may not have finished

#### Scenario: Reading an image back
- **WHEN** an authenticated owner asks for a side that is on file
- **THEN** the system answers with a signed URL that expires

#### Scenario: Asking for a side that is not on file
- **WHEN** an authenticated owner asks for a side the customer has not recorded
- **THEN** the system responds with HTTP 404

#### Scenario: Removing a side
- **WHEN** an authenticated owner removes a side
- **THEN** the record is cleared and the object is deleted

#### Scenario: Storage not configured
- **WHEN** an owner attempts any of these with storage unconfigured
- **THEN** the system refuses saying so, and other customer operations continue to work

#### Scenario: A customer reports what is on file
- **WHEN** an authenticated owner retrieves or lists customers
- **THEN** each reports whether it has a front and whether it has a back, without exposing the storage keys

