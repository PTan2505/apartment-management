## ADDED Requirements

### Requirement: The signing form takes both sides of the tenant's ID card
The form that signs a tenancy SHALL offer to attach a photograph of each side of the signatory's ID card, and SHALL attach them to the person the tenancy is signed for.

The images SHALL be optional: a tenancy can be signed without them, because the owner may not have the card to hand.

Where the signatory is a person already on file, choosing new images SHALL replace what that person had, and choosing none SHALL leave what they had alone.

Chosen images SHALL be shown before the form is submitted, so the owner can see they picked the right photographs and the right way round.

If a tenancy is created and its images then fail to upload, the screen SHALL say so plainly and SHALL NOT imply the tenancy failed — the tenancy exists, and the images can be attached again from the tenancy's own page.

#### Scenario: Signing with both sides
- **WHEN** the owner chooses a front and a back and signs the tenancy
- **THEN** the tenancy is created and its signatory carries both images

#### Scenario: Signing without them
- **WHEN** the owner signs a tenancy without choosing any image
- **THEN** the tenancy is created and the signatory's images are unchanged

#### Scenario: The upload fails after the tenancy is created
- **WHEN** the tenancy is created and an image upload then fails
- **THEN** the screen says the tenancy was created and the images were not attached

### Requirement: A tenancy's page shows the ID card on file for its signatory
The tenancy page SHALL show whether its signatory has each side of their ID card on file, and SHALL allow each side to be viewed, replaced or removed.

Viewing SHALL open the image through the short-lived signed link the API issues, rather than embedding a permanent address.

#### Scenario: Both sides on file
- **WHEN** the owner opens a tenancy whose signatory has both sides on file
- **THEN** the page shows both as present and offers to view each

#### Scenario: Nothing on file
- **WHEN** the owner opens a tenancy whose signatory has no images
- **THEN** the page says so and offers to attach each side

#### Scenario: Removing a side
- **WHEN** the owner removes one side from the tenancy page
- **THEN** that side is no longer on file and the other is unaffected

### Requirement: The signing form can attach the signed contract too
The form that signs a tenancy SHALL offer to attach the signed contract, and SHALL attach it to the tenancy it creates.

It SHALL be optional, SHALL show which file was chosen and how large it is before the form is submitted, and SHALL accept the same file kinds the tenancy's own contract card accepts.

A contract that fails to upload SHALL be reported alongside any ID card that failed, in the same terms: the tenancy exists, these files did not attach, and here is the way to the page that can attach them.

#### Scenario: Signing with the contract attached
- **WHEN** the owner chooses a contract file and signs the tenancy
- **THEN** the tenancy is created carrying that contract

#### Scenario: Signing without one
- **WHEN** the owner signs without choosing a contract
- **THEN** the tenancy is created with no contract, and no error is shown

#### Scenario: The contract fails to upload
- **WHEN** the tenancy is created and the contract upload then fails
- **THEN** the screen says the tenancy was created and names the contract among what did not attach
