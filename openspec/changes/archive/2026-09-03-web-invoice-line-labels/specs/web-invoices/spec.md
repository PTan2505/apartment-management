## ADDED Requirements

### Requirement: A bill's charges are labelled in the reader's language

The application SHALL label each charge on an invoice in Vietnamese, without altering what the system recorded.

The charges are the most-read text in the application: a bill is opened to answer a tenant's question about one line of it. Leaving them in the language the backend happened to write them in puts English in the middle of an otherwise Vietnamese screen, at exactly the point where comprehension matters most.

The label SHALL be built from what the line already carries — its kind, its quantity, the period it covers — rather than from the stored description, for a charge the system computed. Those charges are fully described by their own data, and the stored text adds nothing to them.

**A charge a PERSON wrote SHALL be shown exactly as written.** A service fee carries the name the owner gave it in the building's catalogue; an ad-hoc charge carries what the owner typed about what happened. Rewording either would be rewriting somebody's own words — and they may already be in Vietnamese, since the owner wrote them.

The distinction that governs this is **who wrote the text**, not which kind of line carries it. Those usually coincide and do not always: cancelling a tenancy records what the owner keeps as an ad-hoc charge, because that is the machinery it reuses, so one system-written line arrives carrying the kind that otherwise means a person wrote it. Such a line SHALL be named like any other generated text.

Nothing about what was recorded SHALL change. The stored description remains the record of what was charged, and an invoice issued before this SHALL read the same as one issued after.

#### Scenario: A computed charge

- **WHEN** the owner reads a rent, electricity or water line
- **THEN** it is labelled in Vietnamese, carrying the same quantity and period as before

#### Scenario: A charge the owner named

- **WHEN** the owner reads a service fee or an ad-hoc charge they wrote
- **THEN** it shows the words the owner wrote, unaltered

#### Scenario: A system-written charge on an ad-hoc bill

- **WHEN** the owner reads the line recording what they kept from a cancelled tenancy's deposit
- **THEN** it is named in Vietnamese, because the system wrote it and not the owner

#### Scenario: An older invoice

- **WHEN** the owner opens an invoice issued before this change
- **THEN** its charges read the same as those on a new one

#### Scenario: Nothing recorded changes

- **WHEN** an invoice is displayed
- **THEN** what the system stored for it is unchanged

### Requirement: Deposit lines keep the distinctions between them

The application SHALL name each kind of deposit line individually rather than labelling them all as a deposit.

There are four, and they are not interchangeable: the deposit charged when a tenancy begins, a top-up when a renewal raises it, an amount handed back when a renewal lowers it, and an amount kept when a tenancy is cancelled. One of them is a **negative** figure. Collapsing them into one word would leave a reader looking at a negative amount labelled "deposit" with no account of why money is going the other way.

Where a deposit line is not recognised, the application SHALL show it as stored rather than guess. An unfamiliar line then reads in English on a Vietnamese screen — which is what happens today — instead of being given a label that may be wrong about what happened.

#### Scenario: The deposit charged at move-in

- **WHEN** the owner reads the deposit line on a move-in bill
- **THEN** it is named as the deposit, with the months it was agreed in

#### Scenario: An amount handed back at renewal

- **WHEN** a renewal lowers the deposit and hands part of it back
- **THEN** that line is named as a return, distinct from a deposit being charged

#### Scenario: An amount kept at a cancellation

- **WHEN** an owner keeps part of a deposit when cancelling a tenancy
- **THEN** that line is named as an amount kept, distinct from both of the above

#### Scenario: A deposit line that is not recognised

- **WHEN** a deposit line does not match a known kind
- **THEN** it is shown as stored, rather than labelled with a guess
