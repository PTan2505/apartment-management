## ADDED Requirements

### Requirement: Money received for a withdrawn invoice stays out of the cash figure

The report's figure for money that arrived SHALL NOT include payments on a withdrawn invoice, including money that arrived after the invoice was withdrawn.

That money is owed back to the tenant until the owner returns it. Counting it as money received reports income the owner is about to hand back, and counting it again if the owner later reissues the bill and records it there reports the same money twice. The invoice screens flag it instead, so it is not lost by being left out.

#### Scenario: Money arrived after withdrawal

- **WHEN** money arrives for a withdrawn invoice within the reported range
- **THEN** the cash figure for that month does not include it

#### Scenario: That money is returned

- **WHEN** the owner reverses it
- **THEN** the cash figure is unchanged by the reversal as well
