## ADDED Requirements

### Requirement: Money received after withdrawal is shown for the owner to return

Where an invoice reports money received after it was withdrawn, the application SHALL say so on the invoice screen, in the invoice list and in the tenancy's invoice panel, with the amount, and SHALL tell the owner the money has to be returned to the tenant by reversing the payment.

A tenant has paid for a bill they no longer owe, and nothing else on these screens would show it: the bill reads as withdrawn, and the money is kept out of the revenue report. Without a mark on the bill itself the transfer is invisible until the tenant asks for it back.

The mark SHALL disappear once the payment is reversed.

#### Scenario: Opening a withdrawn bill that was paid

- **WHEN** the owner opens a withdrawn invoice that reports money received after withdrawal
- **THEN** the screen shows the amount, says it arrived after the bill was withdrawn, and says to return it by reversing the payment

#### Scenario: Scanning the lists

- **WHEN** the owner views the invoice list with withdrawn bills included, or a tenancy's invoice panel
- **THEN** that invoice is marked as having money to return

#### Scenario: After the money is returned

- **WHEN** the owner reverses the payment
- **THEN** the mark is gone from every screen
