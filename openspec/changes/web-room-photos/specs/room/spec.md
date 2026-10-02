## ADDED Requirements

### Requirement: A room carries photographs

A room SHALL be able to hold photographs, and they SHALL belong to the ROOM rather than
to any tenancy in it: a photograph taken under one tenant is still a picture of the same
room under the next.

Photographs SHALL be uploaded the way every other image in this system is — the API
signs a short-lived URL, the browser sends the bytes straight to storage, and the API
records the object only once it confirms the object arrived. Image bytes SHALL NOT pass
through the API process.

Only image types SHALL be accepted, with a stated size ceiling, and both SHALL be
enforced where the URL is signed rather than only in the browser.

Photographs SHALL be read back through short-lived links, so a URL copied out of the
page cannot be shared indefinitely.

They SHALL be ordered by when they were uploaded, and the FIRST SHALL be the one that
stands for the room where only one can be shown. Ordering by upload rather than by a
position the owner drags is deliberate: a position is a second thing to maintain, and
re-uploading is cheap.

Removing a photograph SHALL remove it, not retire it. Unlike a tenancy or an invoice, a
photograph records nothing anybody may later need to prove.

Uploading and removing SHALL require an `owner` or a `manager`. Reading SHALL be open to
both. A `maintenance` account SHALL reach none of it.

Where storage is not configured, the endpoints SHALL say so plainly rather than offering
an upload that cannot work.

#### Scenario: Uploading

- **WHEN** the owner asks for an upload URL for a room, uploads the bytes, and confirms
- **THEN** the room carries that photograph, and it is returned with a link that expires

#### Scenario: The bytes do not pass through the API

- **WHEN** a photograph is uploaded
- **THEN** the API signs a URL and confirms the object, and at no point receives the image itself

#### Scenario: A file that is not an image

- **WHEN** an upload URL is asked for with a content type that is not an accepted image type
- **THEN** the system responds with HTTP 400 and signs nothing

#### Scenario: Too large

- **WHEN** an object larger than the ceiling is confirmed
- **THEN** the system refuses to record it

#### Scenario: Confirming something that never arrived

- **WHEN** a key is confirmed for an object that is not in storage
- **THEN** the system responds with HTTP 400 and records nothing

#### Scenario: Photographs outlive a tenancy

- **WHEN** a tenancy in a photographed room ends and another begins
- **THEN** the room's photographs are unchanged

#### Scenario: A manager uploads

- **WHEN** a manager uploads a photograph to a room in a building they cover
- **THEN** it is recorded, though the same manager may not edit that room

#### Scenario: A manager in another building

- **WHEN** a manager uploads to a room in a building they do not cover
- **THEN** the system responds with HTTP 404, as it does for every other request about that room

#### Scenario: Maintenance

- **WHEN** a maintenance account reads or uploads a room photograph
- **THEN** the system responds with HTTP 403

#### Scenario: Removing one

- **WHEN** the owner removes a photograph
- **THEN** it is gone from the room and from storage

#### Scenario: Storage not configured

- **WHEN** an upload URL is asked for and storage is not configured
- **THEN** the system says so rather than failing as an unexpected error
