## ADDED Requirements

### Requirement: The application presents itself in Vietnamese

Every string the owner reads SHALL be in Vietnamese: labels, buttons, headings, helper text, empty states, confirmations, validation messages, and the navigation.

The application is used to run a Vietnamese business by a Vietnamese owner. English was tolerable while the screens were being built and read by whoever built them; it stops being tolerable the moment the figures on them are the ones somebody's income depends on.

Where a message originates in the API and reaches the screen unaltered, the screen SHALL NOT be required to translate it. Whether the API speaks Vietnamese is a separate question from whether the screens do, and a screen that can phrase its own message SHALL do so rather than passing one through.

#### Scenario: Reading any screen

- **WHEN** the owner opens any screen in the application
- **THEN** every label, button, heading and explanatory line is in Vietnamese

#### Scenario: A form refuses what the owner entered

- **WHEN** a form rejects a value it can judge itself
- **THEN** the reason is given in Vietnamese

#### Scenario: A screen has nothing to show

- **WHEN** a list has no rows
- **THEN** what it says is in Vietnamese

### Requirement: Domain terms use one agreed vocabulary

The application SHALL use a single word for each domain concept across every screen.

This matters more than the translation itself. The same idea appears on six screens — a tenancy, a bill, a deposit, a meter reading — and translated screen by screen it acquires a different name on each. A reader who meets one word on the leases screen and another on the invoices screen cannot tell whether they are the same thing, and will eventually decide they are not.

The vocabulary SHALL distinguish concepts the system deliberately distinguishes. In particular a tenancy that was **cancelled** and one that **ended** SHALL NOT share a word, because the whole reason cancellation exists is that they are different events.

#### Scenario: The same concept on two screens

- **WHEN** the owner sees a tenancy named on the leases screen and on an invoice
- **THEN** the same word is used for it in both places

#### Scenario: Concepts the system distinguishes stay distinct

- **WHEN** the owner sees a cancelled tenancy and a finished one
- **THEN** they are named differently, as they are in the record

### Requirement: Dates and months read as a Vietnamese reader expects

The application SHALL present dates as `dd/mm/yyyy` and month names in Vietnamese.

A date shown as `August 2026` in an otherwise Vietnamese screen is a fragment the reader has to translate, and month names appear on every billing and reporting screen.

The exclusive-ending convention SHALL be unaffected: a date that ends a tenancy is still shown as the last day covered, never as the boundary the API reports.

#### Scenario: A month is named

- **WHEN** a screen names a month
- **THEN** it is named in Vietnamese

#### Scenario: An ending date

- **WHEN** a tenancy's ending is shown
- **THEN** it is still the last day covered, in Vietnamese formatting
