## MODIFIED Requirements

### Requirement: Monetary values are numbers before any screen uses them

Monetary values SHALL be numbers wherever application code reads them, so that no screen performs arithmetic, comparison, or sorting on a monetary string.

The API transports them as numbers, so the application SHALL rely on that rather than converting them itself. A client-side conversion step would be a second place for the rule to be applied inconsistently, and would silently mask the API regressing.

Identifiers, room codes, phone numbers, and any other digit-bearing text SHALL remain text, because coercing them would corrupt values whose leading zeros or length are significant.

#### Scenario: A monetary value is a number in application code

- **WHEN** application code reads a monetary field from an API response
- **THEN** the value is a number, and arithmetic and numeric comparison on it produce correct results

#### Scenario: Monetary values sort numerically

- **WHEN** a set of records is ordered by a monetary field
- **THEN** the ordering is numeric, so a larger amount never sorts below a smaller one because of its text form

#### Scenario: A digit-bearing identifier is not coerced

- **WHEN** application code reads a phone number, room code, or other digit-bearing text field from an API response
- **THEN** the value remains text, retaining any leading zeros and its exact original form

#### Scenario: An absent monetary value survives conversion

- **WHEN** a monetary field is absent or null in an API response
- **THEN** application code reads it as absent or null rather than as zero

#### Scenario: Amounts are formatted for display without being reinterpreted

- **WHEN** a monetary value is shown to the user
- **THEN** it is formatted as currency for presentation, and that formatting does not alter the underlying value used for arithmetic or ordering
