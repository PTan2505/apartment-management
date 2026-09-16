## ADDED Requirements

### Requirement: Money that arrives for a withdrawn invoice is recorded without settling it

When the gateway reports that money arrived for a payment whose invoice has been withdrawn, the system SHALL record the payment as succeeded with the date the money arrived, and SHALL NOT mark the invoice paid or move any deposit.

The money is real, so it must be on record: a transfer the system does not know about is money nobody can return. But the owner withdrew the bill, and settling it would reverse that decision without anyone making it, and would add to the deposit holding for a charge that no longer exists.

This SHALL apply whether the payment was still pending or had been retired when the invoice was withdrawn, and whether the money is learned from a confirmation or from catching a confirmation that was lost. A tenant who paid seconds before the withdrawal sends a confirmation that arrives after it, and that money must not be dropped because the payment was retired in between.

The confirmation SHALL still be verified, and its amount SHALL still match, before anything is recorded. A confirmation for a withdrawn invoice's payment that has already succeeded SHALL change nothing, so a retried delivery stays harmless.

#### Scenario: A confirmation for a withdrawn invoice

- **WHEN** a verified confirmation arrives for a pending payment on a withdrawn invoice
- **THEN** the payment is recorded as succeeded with the date the money arrived, the invoice stays withdrawn and unpaid, and the deposit holding is unchanged

#### Scenario: Paid just before the withdrawal

- **WHEN** a verified confirmation arrives for a payment that was retired when its invoice was withdrawn
- **THEN** the money is recorded as having arrived for the withdrawn invoice rather than ignored

#### Scenario: The same confirmation delivered twice

- **WHEN** the same confirmation arrives again after the money was recorded
- **THEN** nothing changes

#### Scenario: A confirmation for an invoice that was not withdrawn

- **WHEN** a verified confirmation arrives for a pending payment on an invoice that was not withdrawn
- **THEN** the invoice is settled as before
