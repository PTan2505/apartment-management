## ADDED Requirements

### Requirement: Returning money that arrived for a withdrawn invoice leaves the deposit alone

When an owner reverses a payment on a withdrawn invoice, the system SHALL record the payment as reversed without releasing or restoring any deposit holding, and without changing the invoice's payment status.

That money never settled the invoice, so no deposit was ever held for it. Releasing one anyway either refuses the refund with a message about a deposit already spent, or takes money out of a holding that belongs to something else. Reversing it is how the owner returns the money, and that must work.

#### Scenario: Returning money to the tenant

- **WHEN** an owner reverses a succeeded payment on a withdrawn move-in invoice
- **THEN** the payment is recorded as reversed, the tenancy's deposit holding is unchanged, and the invoice stays withdrawn and unpaid

#### Scenario: An ordinary reversal

- **WHEN** an owner reverses a payment on an invoice that was not withdrawn
- **THEN** the deposit is released and the invoice's status recomputed as before
