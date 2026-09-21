## ADDED Requirements

### Requirement: Reversing a payment is confirmed before it is sent

The application SHALL ask the owner to confirm reversing a payment, and SHALL send nothing until they do.

The confirmation SHALL name the amount and the date the payment was received, and SHALL say that the invoice returns to unpaid. Both facts matter at that moment: an invoice can carry more than one payment, so the amount is how the owner knows which one they are about to reverse, and the invoice's return to unpaid is a consequence of the action rather than something the button says.

The confirmation SHALL NOT be offered for a payment already reversed.

#### Scenario: Reversing is confirmed first

- **WHEN** the owner starts to reverse a payment and does not confirm
- **THEN** no request is sent, the payment stands, and the invoice stays as it was

#### Scenario: The confirmation names the payment

- **WHEN** the owner is asked to confirm reversing a payment
- **THEN** the question names that payment's amount and the date it was received

#### Scenario: The confirmation names the consequence

- **WHEN** the owner is asked to confirm reversing a payment
- **THEN** the question says the invoice returns to unpaid

#### Scenario: Confirming reverses it

- **WHEN** the owner confirms
- **THEN** the payment is reversed, the invoice returns to unpaid, and both the payment and its reversal remain visible
