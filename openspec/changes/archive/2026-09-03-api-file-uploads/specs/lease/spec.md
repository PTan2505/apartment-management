## ADDED Requirements

### Requirement: A tenancy can carry its signed contract

The system SHALL allow an authenticated `owner` to attach one signed contract file to a tenancy, to replace it, to remove it, and to retrieve it.

The record cannot otherwise settle an argument. When a tenant says the rent was different or that no deposit was agreed, every figure here is one party's assertion; the signed page is the only thing that is not.

The file SHALL be evidence attached to the record and nothing more. No rule SHALL read it, and no reported value SHALL derive from it — a tenancy with no contract SHALL behave in every other way exactly like one that has it.

Replacing a contract SHALL leave the tenancy with exactly one, and SHALL NOT leave the previous file behind in storage. Storage nobody can reach from the application is storage nobody will ever clear.

#### Scenario: Attaching a contract

- **WHEN** an authenticated owner attaches a contract to a tenancy
- **THEN** the tenancy reports that it has one

#### Scenario: Replacing a contract

- **WHEN** an authenticated owner attaches a contract to a tenancy that already has one
- **THEN** the tenancy carries the new one and the previous file is removed from storage

#### Scenario: Removing a contract

- **WHEN** an authenticated owner removes a tenancy's contract
- **THEN** the tenancy reports that it has none, and the file is removed from storage

#### Scenario: A tenancy without one behaves normally

- **WHEN** a tenancy has no contract attached
- **THEN** every other operation on it behaves exactly as it does today

### Requirement: Contract bytes do not pass through the API

The system SHALL issue a short-lived signed URL that uploads the file directly to storage, and SHALL NOT accept the file's bytes itself.

A scan of a contract is megabytes uploaded from a phone. Passing it through this process would hold a request open for the length of that upload, on a server whose whole job is answering questions about small records — and the process has nothing to do with the bytes.

**A signed upload URL SHALL permit writing exactly one object**, under the prefix belonging to that tenancy. A URL obtained for one tenancy SHALL NOT be usable to write anywhere else, because the caller chooses none of the destination.

The URL SHALL expire in minutes rather than hours. It authorises a write to the owner's storage, and its useful life is the length of one upload.

The permitted content type SHALL be fixed when the URL is signed, so that a URL obtained for a document cannot be used to store something else.

#### Scenario: Obtaining an upload URL

- **WHEN** an authenticated owner asks to upload a contract for a tenancy
- **THEN** the system responds with a signed URL, the key it will write, and when the URL expires

#### Scenario: The destination is not the caller's to choose

- **WHEN** an authenticated owner obtains an upload URL
- **THEN** the object it may write is under that tenancy's own prefix, whatever the caller asked for

#### Scenario: An expired URL

- **WHEN** an upload is attempted with a URL past its expiry
- **THEN** storage refuses it

#### Scenario: Storage is not configured

- **WHEN** an authenticated owner asks to upload a contract while storage is unconfigured
- **THEN** the system says so, and every other part of the system continues to work

### Requirement: An upload is confirmed before it is recorded

The system SHALL record a tenancy's contract only after confirming the object exists in storage, and SHALL check its size and content type at that point.

A signed URL is handed out before anything is uploaded, and the upload can fail after it — the browser can be closed, the connection dropped, the file rejected. Recording the contract when the URL is issued would leave tenancies claiming a contract that is not there, and nothing would ever notice.

**A file exceeding the permitted size SHALL be refused and removed from storage.** A size cannot be enforced by a signed PUT the way a content type can, so it is enforced where it can be — after the fact, before anything is recorded — and the rejected object is not left behind.

#### Scenario: Confirming an upload

- **WHEN** an authenticated owner confirms an upload that reached storage
- **THEN** the tenancy records the contract

#### Scenario: Confirming an upload that never arrived

- **WHEN** an authenticated owner confirms an upload for an object that is not in storage
- **THEN** the system refuses and the tenancy records nothing

#### Scenario: A file that is too large

- **WHEN** the uploaded object exceeds the permitted size
- **THEN** the system refuses it, removes it from storage, and the tenancy records nothing

#### Scenario: Confirming against another tenancy's object

- **WHEN** a confirmation names a key outside that tenancy's prefix
- **THEN** the system refuses

### Requirement: A contract is read back by a short-lived link

The system SHALL return a short-lived signed URL for reading a tenancy's contract, and the stored file SHALL NOT be publicly readable.

A contract carries names, an address, a signature and a phone number. A permanent link is one forwarded message away from being public, and a link that expires limits the damage of forwarding it to the minutes after it was sent.

#### Scenario: Reading a contract

- **WHEN** an authenticated owner asks for a tenancy's contract
- **THEN** the system responds with a signed URL that expires

#### Scenario: A tenancy with no contract

- **WHEN** an authenticated owner asks for a contract on a tenancy that has none
- **THEN** the system responds with HTTP 404

#### Scenario: The file is not public

- **WHEN** the stored object is requested without a signed URL
- **THEN** storage refuses it

### Requirement: Contract endpoints require an authenticated owner

Every contract operation SHALL require an authenticated `owner`.

#### Scenario: Unauthenticated

- **WHEN** an unauthenticated request asks for an upload URL, confirms an upload, reads a contract, or removes one
- **THEN** the system responds with HTTP 401
