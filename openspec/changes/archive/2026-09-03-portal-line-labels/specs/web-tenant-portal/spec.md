## MODIFIED Requirements

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
