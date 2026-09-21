## ADDED Requirements

### Requirement: The tenancy's rates can be corrected from its terms dialog
The screen that corrects a running tenancy's terms SHALL offer its electricity and water rates, filled with what the tenancy currently records, and SHALL say that the change applies to this tenancy alone and leaves invoices already issued as they are.

#### Scenario: Owner corrects a rate
- **WHEN** the owner opens a running tenancy's terms and changes its electricity rate
- **THEN** the tenancy is saved with the new rate, and the building's rate is unchanged

#### Scenario: The fields open filled
- **WHEN** the owner opens the terms dialog
- **THEN** both rate fields show what the tenancy is currently billed at

### Requirement: Choosing a room fills what that room already answers
On the form that signs a tenancy, choosing a room SHALL fill the agreed rent with that room's rent, the opening meter reading with the room's latest known reading, and the electricity and water rates with its building's, rather than leaving them blank beside a note explaining what an empty field would mean.

Both SHALL remain editable, because either may be agreed differently for a particular tenant, and choosing a different room SHALL fill them again from that room.

#### Scenario: Choosing a room
- **WHEN** the owner chooses a room on the tenancy form
- **THEN** the agreed rent shows that room's rent, the opening reading shows its latest known reading, and both rate fields show its building's rates

#### Scenario: Signing at a rate of this tenancy's own
- **WHEN** the owner edits a filled-in rate and signs
- **THEN** the tenancy records the edited rate and the building's rate is unchanged

#### Scenario: Changing the room
- **WHEN** the owner then chooses a different room
- **THEN** both fields are filled again from the newly chosen room

#### Scenario: The figures can still be overridden
- **WHEN** the owner edits the filled-in rent
- **THEN** the tenancy is signed at the edited figure
