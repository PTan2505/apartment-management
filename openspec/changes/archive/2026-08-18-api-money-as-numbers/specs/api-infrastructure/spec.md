## ADDED Requirements

### Requirement: Monetary values are transported as numbers

Every monetary value in an API response — an amount, a rate, or a measured quantity — SHALL be transported as a JSON number, not as a string. A caller SHALL be able to perform arithmetic, comparison, and ordering on such a value without converting it first.

A monetary value that is absent SHALL be transported as null, and SHALL NOT be reported as zero. The two mean different things: an expense with no recorded rate is not an expense charged at nothing.

This SHALL hold uniformly across every endpoint that returns such a value, including computed figures that are derived rather than stored, so that no caller has to know which fields need special handling.

Values that merely consist of digits — identifiers, phone numbers, room codes — SHALL remain text. Their leading zeros and exact form are significant, and converting them would corrupt them.

#### Scenario: An amount is a number

- **WHEN** a response contains a monetary amount
- **THEN** the value is a JSON number, and ordering a set of such values compares them numerically rather than lexicographically

#### Scenario: A rate is a number

- **WHEN** a response contains a rate, such as a per-unit or per-person charge
- **THEN** the value is a JSON number, including its fractional part where it has one

#### Scenario: A computed total is a number

- **WHEN** a response contains a figure derived from other values rather than stored directly
- **THEN** that figure is a JSON number on the same terms as a stored one

#### Scenario: An absent amount stays absent

- **WHEN** a response contains a monetary field that has no value
- **THEN** the field is null rather than zero or an empty string

#### Scenario: Digit-bearing text is not converted

- **WHEN** a response contains an identifier, phone number, or room code
- **THEN** it is transported as text, retaining any leading zeros and its exact form
