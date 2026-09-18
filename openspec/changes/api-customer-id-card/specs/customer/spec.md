## ADDED Requirements

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
