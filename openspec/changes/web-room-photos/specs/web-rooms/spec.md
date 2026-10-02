## ADDED Requirements

### Requirement: A room's page shows its photographs, and the list shows the first

A room's own page SHALL show the photographs it holds, and SHALL let an `owner` or a
`manager` add and remove them.

The rooms LIST SHALL show the first photograph of each room beside its code, small. A
list of fifty-eight rows of text is read by searching; a list with pictures is read by
recognising. A room with no photograph SHALL leave a plain placeholder of the same size,
so rows do not change height and the column does not collapse and reappear as the page
changes.

Uploading SHALL show that it is happening and SHALL report a failure against the file
that failed, not against the group: several photographs chosen at once must not all be
lost because one was rejected.

Removing a photograph SHALL be confirmed, because it cannot be undone.

Where storage is not configured, the page SHALL say so and SHALL NOT offer to upload.

A role that may not upload SHALL see the photographs and no control — the rule already
set for every other control in this application.

#### Scenario: Looking at a room

- **WHEN** the owner opens a room that has photographs
- **THEN** they are shown, largest first in upload order, each opening to full size

#### Scenario: Adding some

- **WHEN** the owner chooses three photographs
- **THEN** progress is shown, and on success they appear without a reload

#### Scenario: One of several fails

- **WHEN** three are chosen and one is rejected
- **THEN** the two that worked are recorded and the page names the one that did not

#### Scenario: The list

- **WHEN** the owner opens the rooms list
- **THEN** each row shows its first photograph, and rows without one keep the same height

#### Scenario: A room with no photographs

- **WHEN** the owner opens a room that has none
- **THEN** the page says so and offers to add some

#### Scenario: Removing

- **WHEN** the owner removes a photograph
- **THEN** they are asked to confirm first, and it disappears without a reload

#### Scenario: A manager

- **WHEN** a manager opens a room in a building they cover
- **THEN** the photographs are shown and they may add and remove them

#### Scenario: Storage not configured

- **WHEN** the page loads and storage is not configured
- **THEN** it says so and offers no upload control

#### Scenario: On a phone

- **WHEN** the room page is read at 390px
- **THEN** the photographs fit the width and the page does not scroll sideways
