## ADDED Requirements

### Requirement: The tenancies screen offers the blank contract template
The tenancies screen SHALL show whether a blank contract template is on file, and SHALL offer to download it, replace it, or remove it.

Where one is on file it SHALL name the file and say when it was uploaded, so the owner can tell the current one from the copy on their own machine.

Where none is on file it SHALL say so and offer to upload one, rather than showing nothing.

It SHALL sit above the list of tenancies and SHALL NOT crowd it: this is a thing consulted occasionally, not the screen's subject.

#### Scenario: A template on file
- **WHEN** the owner opens the tenancies screen with a template on file
- **THEN** it names the file and offers to download, replace or remove it

#### Scenario: No template yet
- **WHEN** the owner opens the tenancies screen with no template on file
- **THEN** it says so and offers to upload one

#### Scenario: Downloading to print
- **WHEN** the owner downloads the template
- **THEN** the file arrives under its original name

#### Scenario: Phone width
- **WHEN** the owner opens the tenancies screen at phone width
- **THEN** the template section fits without the page scrolling sideways
