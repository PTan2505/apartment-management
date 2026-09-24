## ADDED Requirements

### Requirement: The tenancy screen carries the link a tenant pays through

The tenancy screen SHALL show the payment link for that tenancy, ready to copy,
together with when it was issued and when it was last opened.

The link is the only way a tenant reaches their bills, and until now the
application could not produce one at all — the API could, and no screen asked
it to.

The screen SHALL allow reissuing the link, which stops the previous one working,
and withdrawing it, which leaves the tenancy with no link. Both SHALL confirm
before acting, being irreversible for whoever already holds the old link.

The screen SHALL say plainly what the link grants: whoever opens it can see and
pay that tenancy's bills.

Where a link exists but cannot be shown, the screen SHALL say so and offer to
reissue, rather than showing an empty box.

#### Scenario: Copying the link

- **WHEN** the owner opens a tenancy
- **THEN** its payment link is shown and can be copied in one action

#### Scenario: What it says about itself

- **WHEN** the owner reads the link
- **THEN** it says when it was issued, whether it has ever been opened, and what anyone holding it can do

#### Scenario: Replacing a link

- **WHEN** the owner reissues the link and confirms
- **THEN** a new link is shown and the owner is told the previous one has stopped working

#### Scenario: Withdrawing a link

- **WHEN** the owner withdraws the link and confirms
- **THEN** the tenancy has no link, and the screen offers to issue one

#### Scenario: A tenancy that has no link

- **WHEN** the owner opens a tenancy whose link was withdrawn
- **THEN** the screen says there is none and offers to issue one
