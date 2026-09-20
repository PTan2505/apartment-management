## REMOVED Requirements

### Requirement: The contract is reported as present or absent, never as a location

**Reason**: It required the screen to report only WHETHER a contract is on file and to offer to view or replace it. With the contract held as photographs, presence is not the useful fact — the pages themselves are, and an owner checking an agreement wants to read it rather than be told it exists.

**Migration**: None. Replaced by "The contract is shown as the pages it is" below, which keeps the rules that matter: no storage location on screen, the unconfigured-storage case stated rather than offered, and the limits stated before a file is chosen.

## ADDED Requirements

### Requirement: The contract is shown as the pages it is

The application SHALL show a tenancy's contract pages as images, in order, and SHALL let the owner open one full size.

The pages ARE the information. "Đã có bản scan trên hệ thống" beside a button asks the owner to take the contract on trust and click to find out what it says, and a phone photograph is unreadable at thumbnail size — which is why opening one full size is part of this, exactly as it is for the ID card.

The application SHALL let several pages be chosen and uploaded in one go, SHALL let further pages be added later, and SHALL let any single page be removed without disturbing the others.

The application SHALL NOT display a page's storage location, its name as stored, or any address derived from it. Every link is signed at the moment it is requested, so a stored location on screen would be an address that cannot be opened, and one more thing to leak.

Where this deployment cannot store files at all, the screen SHALL say the storage is unconfigured rather than offering an upload that is certain to fail.

The screen SHALL state the size limit and that photographs are what it takes, before a file is chosen rather than after it is refused.

Removing a page SHALL be confirmed first, naming what is about to be lost.

#### Scenario: Reading a contract

- **WHEN** the owner opens a tenancy whose contract pages have been uploaded
- **THEN** the pages are shown as images in the order they were added, without showing where they are stored

#### Scenario: Opening a page

- **WHEN** the owner opens one page
- **THEN** it is shown full size

#### Scenario: Uploading several at once

- **WHEN** the owner chooses three photographs in one go
- **THEN** all three are attached, and the screen reports progress while they upload

#### Scenario: Adding a page later

- **WHEN** the owner adds another photograph to a tenancy that already has pages
- **THEN** it joins them rather than replacing them

#### Scenario: Removing one page

- **WHEN** the owner removes one page and confirms
- **THEN** that page is gone and the others remain

#### Scenario: No pages yet

- **WHEN** the owner opens a tenancy with no contract pages
- **THEN** the screen says so and offers an upload, stating the size limit and that photographs are what it accepts

#### Scenario: Storage is not configured

- **WHEN** the deployment has no storage configured
- **THEN** the screen says so, and does not offer an upload

#### Scenario: One page fails among several

- **WHEN** three pages are uploaded and one fails
- **THEN** the screen says which failed, the other two are attached, and the tenancy is not left claiming pages it does not have
