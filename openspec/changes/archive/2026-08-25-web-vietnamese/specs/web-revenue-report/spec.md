## ADDED Requirements

### Requirement: The revenue figures are named for the questions they answer

The application SHALL name each figure on the revenue screen by what it counts, rather than by its accounting label.

This is the complaint that produced this change. Reading the screen, the owner could not tell `settled` from `received` from `billed` — and telling them apart is the entire purpose of that screen. Three of them are keyed on the month an invoice was **issued** and one on the month money **arrived**, and a reader who has to translate a term before comparing it will compare it wrongly.

A literal translation SHALL NOT be considered sufficient. `Settled` rendered word-for-word is as opaque in Vietnamese as it was in English; what makes it legible is naming the question — *what has been collected against the bills issued in this month* — not finding an equivalent noun.

The naming SHALL make the relationship between the three accrual figures visible: what was billed splits exactly into what has been collected and what is still owed. That identity is the reader's only way to check the table against itself, and words that obscure it discard a free correctness check.

The cash figure SHALL be named so that it cannot be read as one of the other three, and SHALL continue to be presented apart from them.

#### Scenario: Reading the figures

- **WHEN** the owner reads a month's figures
- **THEN** each is named for what it counts, and the names distinguish money billed from money received

#### Scenario: The relationship between the accrual figures

- **WHEN** the owner reads what was billed, collected and owed
- **THEN** the naming makes plain that the second and third are parts of the first

#### Scenario: The cash figure cannot be mistaken

- **WHEN** the owner reads the money-arrived figure
- **THEN** its name says it is money received in that month, distinct from anything billed
