## MODIFIED Requirements

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

## ADDED Requirements

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
