## ADDED Requirements

### Requirement: The portal says where a bill is from and who to ask about it

The portal SHALL report, for each bill, the building the room belongs to, and SHALL report a way to contact whoever can answer a question about it.

A tenant opens this link because something looks wrong. The screen's whole purpose is to answer "what am I being charged for" — and when it does not, the next question has nowhere to go. A page that explains a charge and then offers no route to a person is self-service only for the tenant who was already satisfied.

The building matters for a smaller but real reason: a person may hold tenancies in two of them, and a room code alone does not say which.

The contact SHALL be reported as a name and a number a tenant can act on, not as an identifier for a record they cannot look up.

#### Scenario: A bill says where it is from

- **WHEN** a tenant reads a bill in the portal
- **THEN** the building its room belongs to is reported with it

#### Scenario: Two buildings

- **WHEN** a tenant holds tenancies in two buildings and has bills for both
- **THEN** each bill reports its own building

#### Scenario: Somebody to ask

- **WHEN** a tenant reads their bills
- **THEN** the portal reports who to contact about them, with a number that can be dialled

### Requirement: A bill says when it is due and when it was settled

The portal SHALL report, for an unpaid bill, the date by which it is due, and for a settled one, the date it was settled.

"Unpaid" answers a different question from "overdue", and today a tenant can only be told the first. A date is also what makes a reminder checkable: a tenant told they are late can see whether they are.

A settlement date closes the same loop from the other side. A tenant who paid last week and returns to check needs to see that the payment landed and when — `isPaid` alone tells them the system agrees, but not that it agrees about the payment they are thinking of.

Where a bill has no due date recorded, the portal SHALL report its absence rather than substituting one. A due date invented from the issue date would be presented to a tenant as an obligation nobody agreed.

#### Scenario: An unpaid bill

- **WHEN** a tenant reads a bill that has not been paid
- **THEN** the date it is due is reported with it

#### Scenario: A settled bill

- **WHEN** a tenant reads a bill that has been paid
- **THEN** the date it was settled is reported with it

#### Scenario: A bill with no due date recorded

- **WHEN** a bill carries no due date
- **THEN** the portal reports it as absent rather than deriving one

### Requirement: Transfer details can be read without creating a payment

The portal SHALL be able to report the transfer details for an unpaid bill — where the money goes, how much, and what reference to use — without recording a payment.

Today those details exist only in the answer to the request that starts a payment. So a tenant who wants to see the account before deciding, or to type the transfer into their banking application by hand, cannot be shown it unless the system records an attempt they did not make. The record then contains payments nobody started, and the screen cannot show a tenant where their money should go without lying to the database about what they did.

Reading SHALL remain a read: it SHALL NOT create, reserve, or expire anything.

Starting a payment SHALL remain a separate, deliberate act. This requirement adds a way to look; it does not remove the act of paying.

#### Scenario: Looking without paying

- **WHEN** a tenant asks for an unpaid bill's transfer details
- **THEN** they are reported, and no payment record is created

#### Scenario: Looking twice

- **WHEN** a tenant asks for the same bill's transfer details twice
- **THEN** both answers report the same details, and nothing has been recorded

#### Scenario: Paying is still its own act

- **WHEN** a tenant starts a payment
- **THEN** that is recorded as it is today, unaffected by having looked first

#### Scenario: A bill that is already settled

- **WHEN** a tenant asks for transfer details for a bill that has been paid
- **THEN** they are told there is nothing to pay rather than being given an account to send money to
