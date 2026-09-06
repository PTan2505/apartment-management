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

**The most recent bill SHALL be open on arrival, and the rest closed.** A tenant opens this link because of one bill, almost always the newest and almost always unpaid; a list that opens entirely closed asks them to go and find the thing they were sent here for.

An unpaid bill SHALL lead with what is owed, stated once, so the amount, the state and the bill they belong to are one reading rather than three.

A tenant with no bills SHALL be told so plainly rather than shown an empty area.

#### Scenario: Bills are listed newest first

- **WHEN** a tenant with several bills opens the portal
- **THEN** they appear in order of issue, most recent at the top

#### Scenario: The newest bill is already open

- **WHEN** a tenant with several bills opens the portal
- **THEN** the most recent bill is expanded and the others are not

#### Scenario: Paid and unpaid are distinguishable at a glance

- **WHEN** a tenant has both paid and unpaid bills
- **THEN** the two are distinguishable without comparing amounts

#### Scenario: What is owed is stated once

- **WHEN** a tenant reads an unpaid bill
- **THEN** the amount owed and the fact that it is unpaid are read together, without deriving one from the other

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

The application SHALL address the API by a full address supplied at build time, rather than by a path on its own origin, and SHALL use the same address the rest of the application uses.

It sends no cookie and carries its token in a header, so nothing about it depends on sharing an origin with the API.

One address rather than two: a second setting naming the same API is a second thing to configure, a second thing to get wrong, and nothing distinguishes the two values in practice.

An absent or empty address SHALL fail the build rather than produce an application that requests paths on itself.

#### Scenario: Requests reach the API

- **WHEN** the built application makes an API request
- **THEN** it is addressed to the API's own origin

#### Scenario: A missing address

- **WHEN** the application is built without the API address configured
- **THEN** the build fails

### Requirement: The portal is a route in the application

The portal SHALL be a route within the owner's application rather than a separate build, and SHALL be reached without signing in.

Two applications were two of everything — two configs, two entries, two build scripts, two API addresses, two CI steps — for a separation whose only remaining benefit is the size of what a tenant downloads. That benefit is real and was weighed: a tenant now receives the whole application rather than the portal alone. It was accepted as the price of one thing to build, configure and deploy.

**The portal SHALL NOT use the owner's API client.** That client renews the session when a request is refused, and a tenant has no session to renew — sharing it would need a flag saying a request is not really authenticated, which is the kind of thing that gets forgotten. The portal keeps its own module: no interceptor, no cookie.

**The portal SHALL NOT sit within whatever establishes the owner's session.** That asks the API who is signed in as soon as it mounts; for a tenant the answer is nobody, and the attempt costs a refused request and a refused renewal before a bill appears.

A tenant SHALL reach it without passing the sign-in guard, and SHALL NOT be redirected to sign in.

#### Scenario: Opening a link

- **WHEN** a tenant opens their link
- **THEN** the portal loads and shows their bills, without a sign-in screen

#### Scenario: Nothing asks who the tenant is

- **WHEN** a tenant opens their link
- **THEN** no request is made to establish an owner session, and none is renewed

#### Scenario: A refused request is not retried as a session

- **WHEN** a portal request is refused because the token is no longer valid
- **THEN** the portal reports it, and nothing attempts to renew a session

### Requirement: The portal states only what is true of the link it was opened with

The application SHALL NOT tell a tenant that their link expires after any period, unless the system actually expires it.

A portal token has no lifetime in this system. It lives for the length of the tenancy and stops working when the owner revokes it or issues a replacement — chosen deliberately, and the reason a self-expiring token was rejected. A sentence promising seven days would be read by a tenant as a fact about the link in their hand, and it would be false: it would send some to ask for a replacement they do not need, and reassure others that a link they forwarded has since gone dead.

Where a link no longer works, the application SHALL say so without asserting a cause it cannot know. Revocation and replacement are indistinguishable from the browser, and both are true reasons; an expiry is not.

The application SHALL NOT display, as part of the working screen, illustrations of states it is not in.

#### Scenario: A working link

- **WHEN** a tenant opens the portal with a valid link
- **THEN** nothing on the screen states a period for which the link remains valid

#### Scenario: A link that no longer works

- **WHEN** a tenant opens the portal with a revoked or unknown link
- **THEN** they are told the link no longer works and what to do, without being told it expired

#### Scenario: One state at a time

- **WHEN** a tenant is looking at their bills
- **THEN** the screen does not also show what it would look like with no bills, or with a link that no longer works

### Requirement: A charge shows its working beneath it, not beside it

Where a charge was computed from a quantity and a rate, the application SHALL present that working subordinate to the charge, so the charge reads first and its derivation reads second.

A tenant querying a bill is checking two different things at two different moments: what am I being charged for, and how was that number reached. Presented at one weight they interleave, and on a phone that is the difference between a bill that can be scanned and one that has to be studied.

This SHALL NOT remove any figure the tenant can check today. The meter readings, the rate, the quantity and the period are what make a bill checkable rather than merely stated, and presentation may reorder them but not drop them.

#### Scenario: A metered charge

- **WHEN** a tenant reads a charge for metered electricity
- **THEN** the charge and its amount read first, with the readings and the rate beneath them

#### Scenario: Nothing is lost

- **WHEN** a tenant reads any charge that carries a quantity, a rate, or a period
- **THEN** each of those is still shown
