## ADDED Requirements

### Requirement: Withdrawing an invoice retires its unfinished gateway payments

When an owner withdraws an invoice, the system SHALL mark every gateway payment on it that is still pending as cancelled, in the same transaction as the withdrawal, and SHALL then ask the gateway to cancel each of those links.

A withdrawn bill is no longer owed, but the link a tenant was already given still accepts money until the gateway is told otherwise. Leaving it open invites a payment for a debt that no longer exists.

The gateway request SHALL be made after the withdrawal is committed and SHALL NOT be able to undo it. A transaction cannot be held open across a call to somebody else's server, and a gateway that is slow, unreachable or refuses does not change the owner's decision to withdraw the bill. Where the gateway reports that the link was already paid, the money SHALL be recorded as having arrived for a withdrawn invoice.

#### Scenario: Withdrawing a bill with a pending gateway payment

- **WHEN** an owner withdraws an invoice that has a pending gateway payment
- **THEN** the invoice is withdrawn, the payment is recorded as cancelled, and the gateway is asked to cancel its link

#### Scenario: The gateway cannot be reached

- **WHEN** the gateway cannot be reached while retiring the link
- **THEN** the invoice is still withdrawn and the payment still recorded as cancelled

#### Scenario: The link had already been paid

- **WHEN** the gateway refuses to cancel the link because it was already paid
- **THEN** the money is recorded as having arrived for the withdrawn invoice, and the invoice stays withdrawn

### Requirement: An invoice reports money received after it was withdrawn

An invoice SHALL report whether money arrived for it after it was withdrawn, and how much, while that money has not been returned.

A withdrawn invoice with money on it is the one state an owner must act on — the tenant paid for something they no longer owe. Reporting it from the invoice itself means every screen that shows the invoice can say so, and none has to work it out from payment states.

Because withdrawal is refused while an invoice is paid, and a cancelled tenancy withdraws only unpaid invoices, any succeeded payment on a withdrawn invoice arrived after withdrawal.

#### Scenario: Money arrived for a withdrawn invoice

- **WHEN** a withdrawn invoice carries a succeeded payment
- **THEN** it reports that money arrived after withdrawal, and the amount

#### Scenario: The money has been returned

- **WHEN** that payment is reversed
- **THEN** the invoice no longer reports money awaiting return

#### Scenario: An ordinary withdrawn invoice

- **WHEN** a withdrawn invoice carries no succeeded payment
- **THEN** it reports no money received after withdrawal
