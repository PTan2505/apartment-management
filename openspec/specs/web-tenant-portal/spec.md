## Purpose

The screen a tenant opens from a link: their own bills, itemised down to the meter reading, and a code to pay an unpaid one with. No account, no password, nothing to remember.

## Requirements

### Requirement: A link opens the portal and leaves no token behind

The application SHALL read the access token from the URL **fragment**, and SHALL remove it from the address bar as soon as it has been read, without navigating.

The fragment is used because a browser never transmits it — so the token reaches no server log, no proxy, and no referrer header on the way in. Removing it afterwards covers what the fragment does not: browser history, a bookmark, and a screenshot of the address bar sent to somebody else.

The token SHALL be retained for the browsing session, so that reloading the page does not lock a tenant out of a link they can no longer see. It SHALL NOT be retained beyond it.

Where no token is present, or the one presented is not accepted, the application SHALL say the link is no longer valid and offer nothing further. It SHALL NOT distinguish between a link that never existed, one that was withdrawn, and one that is malformed — the API deliberately answers all three identically, and repeating that distinction in the interface would undo it.

#### Scenario: Opening a valid link

- **WHEN** a tenant opens a link carrying a valid token in its fragment
- **THEN** their bills are shown

#### Scenario: The token leaves the address bar

- **WHEN** the portal has loaded from a link
- **THEN** the address bar no longer contains the token, and the page has not navigated

#### Scenario: Reloading

- **WHEN** a tenant reloads the page after the token has been removed from the address bar
- **THEN** their bills are shown again without the link being reopened

#### Scenario: A new browsing session

- **WHEN** a tenant opens the portal in a new browsing session without the link
- **THEN** they are told the link is no longer valid

#### Scenario: A withdrawn link

- **WHEN** a tenant opens a link whose token the owner has revoked
- **THEN** they are told the link is no longer valid, in the same words as for a link that never existed

#### Scenario: No token at all

- **WHEN** the portal is opened with no token in the fragment
- **THEN** they are told the link is no longer valid

### Requirement: A tenant sees their bills, most recent first

The application SHALL list every bill the token entitles the tenant to see, most recently issued first, each showing what kind of bill it is, the date it was issued, the room it belongs to, its total, and whether it has been paid.

A bill with nothing owing SHALL be visibly distinct from one still to be paid, without the tenant having to read an amount to work out which.

A tenant with no bills SHALL be told so plainly rather than shown an empty area.

#### Scenario: Bills are listed newest first

- **WHEN** a tenant with several bills opens the portal
- **THEN** they appear in order of issue, most recent at the top

#### Scenario: Paid and unpaid are distinguishable at a glance

- **WHEN** a tenant has both paid and unpaid bills
- **THEN** the two are distinguishable without comparing amounts

#### Scenario: A tenant with no bills

- **WHEN** a tenant whose tenancy has been billed nothing opens the portal
- **THEN** they are told there is nothing to show

### Requirement: A bill can be read in full

The application SHALL let a tenant open a bill and see the charges that make it up: each charge's description, the quantity and rate it was computed from where it had them, the period it covers, and its amount, adding up to the total.

Where the bill charged metered electricity, the readings it was computed between SHALL be shown.

This is the point of the feature. A total is what an owner can already read down the telephone; what a tenant cannot otherwise check is the meter reading, the rate applied to it, and the days a partial month was prorated by.

Amounts SHALL be shown as currency a Vietnamese reader recognises, not as raw numbers.

**Each charge SHALL be named in Vietnamese**, using the same labelling the owner's screens use. The portal reads the same stored descriptions, which the system writes in English, and a tenant is the more exposed reader of the two: the owner is one person who will learn what a word means, while a tenant is anybody arriving from a link on their phone.

Naming SHALL be by one shared implementation rather than one per surface. Two would eventually describe the same charge differently, and a tenant querying a bill against what the owner is looking at is the moment that difference surfaces.

**A charge the owner wrote SHALL be shown as the charge itself**, not as a category with their words demoted beneath it. What the owner typed about a broken window is the informative part; "a charge" is not.

#### Scenario: Opening a bill

- **WHEN** a tenant opens a monthly bill
- **THEN** its rent, electricity, water and service fee charges are each shown with their own amount and the period they cover

#### Scenario: The charges are named in Vietnamese

- **WHEN** a tenant reads any charge on a bill
- **THEN** it is named in Vietnamese, without the English text the system stored

#### Scenario: A charge the owner described

- **WHEN** a bill carries a charge the owner wrote themselves
- **THEN** their words are shown as the charge's name, unaltered

#### Scenario: The owner and the tenant see the same charge named the same way

- **WHEN** the same bill is read on the owner's screen and in the portal
- **THEN** each charge carries the same name in both

#### Scenario: Electricity shows its working

- **WHEN** a tenant opens a bill charging metered electricity
- **THEN** the meter readings and the rate applied are both shown

#### Scenario: The charges add up

- **WHEN** a tenant reads a bill
- **THEN** the charges shown sum to the total shown

### Requirement: An unpaid bill can be paid by scanning

The application SHALL offer to pay an unpaid bill, and on doing so SHALL show a QR code built from the bank details the API returns for that payment, together with the amount and the account it will reach.

It SHALL also offer the gateway's own checkout page as an alternative. The code is an image fetched from a third party at the moment it is displayed; when that party is unreachable a tenant must still have a way to pay.

Where a bill already has a payment under way, asking to pay it again SHALL show the same code rather than starting another.

Where paying is unavailable — the API reports no gateway configured — the application SHALL say so and leave the bill readable.

#### Scenario: Paying a bill

- **WHEN** a tenant chooses to pay an unpaid bill
- **THEN** a QR code is shown, along with the amount and the account it pays into

#### Scenario: The checkout link is offered too

- **WHEN** a payment has been started
- **THEN** a link to the gateway's own page is shown beside the code

#### Scenario: Returning to a bill already being paid

- **WHEN** a tenant chooses to pay a bill they have already started paying
- **THEN** the same code is shown, not a second one

#### Scenario: The code cannot be displayed

- **WHEN** the image the code is drawn from fails to load
- **THEN** the tenant is told, and the checkout link remains usable

#### Scenario: Paying is not available

- **WHEN** the API reports that online payment is not configured
- **THEN** the tenant is told, and the bill remains readable

### Requirement: The portal finds out when a bill has been paid

After a payment has been started, the application SHALL ask the API whether the bill has been paid, repeatedly, until it has been or until the tenant has been waiting long enough that they have plainly gone away.

Asking is necessary rather than convenient. A tenant who scans the code in their banking application never opens the gateway's page and is never returned to this one, so there is nothing to tell the portal that the money has moved except asking.

When the bill is reported paid, the application SHALL say so unmistakably and stop asking.

The application SHALL stop asking when it is no longer being watched, and SHALL NOT continue indefinitely in a tab somebody has forgotten.

#### Scenario: The bill is paid while the code is shown

- **WHEN** a tenant pays by scanning, and the confirmation reaches the API
- **THEN** the portal shows the bill as paid without the tenant doing anything further

#### Scenario: Asking stops once it is paid

- **WHEN** a bill has been reported paid
- **THEN** the application stops asking about it

#### Scenario: A forgotten tab

- **WHEN** a payment screen has been left open long enough without being paid
- **THEN** the application stops asking, and offers to check again

### Requirement: The portal is usable on a phone, and honest about waiting

The application SHALL be usable at the width of a phone, which is where a link sent by message is opened.

Where the API is slow to answer its first request, the application SHALL say that loading may take a while rather than showing an indicator that is indistinguishable from a page that has failed. The API is hosted where an idle service is suspended and takes some seconds to wake, and a tenant who assumes the page is broken closes it.

An action that has been taken and not yet answered SHALL be visibly in progress, and SHALL NOT be startable twice.

#### Scenario: On a phone

- **WHEN** the portal is opened at the width of a phone
- **THEN** bills and their charges are readable without sideways scrolling

#### Scenario: A slow first response

- **WHEN** the first request takes longer than a few seconds
- **THEN** the tenant is told it may take a moment, rather than being shown only a spinner

#### Scenario: An action in progress

- **WHEN** a tenant has asked to pay and the answer has not arrived
- **THEN** that is visible, and asking again does nothing

### Requirement: The portal reaches the API by an absolute address

The application SHALL address the API by a full address supplied at build time, rather than by a path on its own origin.

It has no proxy in front of it and needs none: it sends no cookie and carries its token in a header, so nothing about it depends on sharing an origin with the API. Requiring one would mean putting a proxy in front of a page that does not need it.

An absent or empty address SHALL fail the build rather than produce an application that requests paths on itself.

#### Scenario: Requests reach the API

- **WHEN** the built application makes an API request
- **THEN** it is addressed to the API's own origin

#### Scenario: A missing address

- **WHEN** the application is built without the API address configured
- **THEN** the build fails
