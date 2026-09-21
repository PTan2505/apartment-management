## ADDED Requirements

### Requirement: The system keeps one blank contract template
The system SHALL allow an authenticated `owner` to keep one blank contract template — the document they print to sign with a new tenant — and to download, replace or remove it.

The template SHALL be held in object storage under one fixed location, and SHALL NOT be recorded in the database. There is one of it, it belongs to nobody in particular, and a row holding a single key would be a second place for the same fact to live — which is how a record and a bucket come to disagree.

Uploading SHALL follow the same three steps the signed contract uses: the API signs a URL for one object of one content type, the browser sends the bytes to storage, and the API records nothing until it has asked storage whether the object arrived.

The API SHALL accept only document kinds a blank contract plausibly is, SHALL refuse anything past a stated size ceiling and delete the over-sized object, and SHALL verify that a key offered for confirmation lies under the template's own prefix.

Replacing SHALL leave exactly one object behind: the new one. The previous template and any upload that reached storage without being confirmed SHALL be removed.

The template's ORIGINAL FILE NAME SHALL be preserved, so downloading it produces a recognisable document rather than a random identifier, and the download SHALL be a short-lived signed link.

Where storage is not configured, these operations SHALL refuse in those terms.

#### Scenario: Uploading a template
- **WHEN** an authenticated owner uploads a blank contract and confirms it
- **THEN** the system reports a template on file, with its file name, its size and when it was uploaded

#### Scenario: Replacing it
- **GIVEN** a template already on file
- **WHEN** the owner uploads another
- **THEN** the new one is on file and exactly one object remains in storage

#### Scenario: Downloading it for printing
- **WHEN** an authenticated owner asks to download the template
- **THEN** the system answers with a signed link that expires, and the download carries the template's original file name

#### Scenario: Nothing on file
- **WHEN** an authenticated owner asks about the template and none has been uploaded
- **THEN** the system reports that there is none, rather than failing

#### Scenario: Downloading when there is none
- **WHEN** an authenticated owner asks to download a template that does not exist
- **THEN** the system responds with HTTP 404

#### Scenario: A key outside the template's own place
- **WHEN** an owner confirms a key that does not lie under the template prefix
- **THEN** the system responds with HTTP 400 and nothing changes

#### Scenario: A file above the ceiling
- **WHEN** an owner confirms an upload larger than the ceiling
- **THEN** the system responds with HTTP 400 and the object is deleted from storage

#### Scenario: Removing it
- **WHEN** an authenticated owner removes the template
- **THEN** storage holds no template and the screen reports none on file

#### Scenario: Storage not configured
- **WHEN** an owner attempts any of these with storage unconfigured
- **THEN** the system refuses saying so
