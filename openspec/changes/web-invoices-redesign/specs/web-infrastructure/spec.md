## ADDED Requirements

### Requirement: The application draws itself from one design system

Colour, typeface, corner radius and table density SHALL be defined once and read by every screen. A screen SHALL NOT choose its own value for any of them.

The reason is not tidiness. These values are the ones that drift: each is a small decision, each is easy to make locally, and none of them looks wrong at the moment it is made. It is only across screens that the drift becomes visible — as an application that looks like several applications, none of which anybody decided on. Changing where the decision lives is what prevents that, and it has to be stated, because the pull is always toward answering the question again on the next screen.

Content SHALL be presented on a surface distinct from the page ground. A table, a form or a set of figures reading directly against the page has no boundary telling a reader where it begins, and a screen where some content has that boundary and some does not reads as unfinished rather than as deliberate.

Monetary amounts SHALL be written with the đồng sign `₫`, not the letter `đ`.

Digits that appear in columns SHALL be set so that they align. A column of money that a reader has to compare digit by digit is not doing the one job a column of money exists to do.

#### Scenario: The same component on two screens

- **WHEN** the owner sees a table on one screen and a table on another
- **THEN** the two have the same row height, the same header treatment, and the same alignment of numbers

#### Scenario: A screen's content against the page

- **WHEN** the owner opens a screen whose purpose is a list, a form or a set of figures
- **THEN** that content sits on a surface distinguishable from the page behind it

#### Scenario: An amount of money anywhere in the application

- **WHEN** an amount is shown to the owner
- **THEN** it carries `₫`

#### Scenario: A column of amounts

- **WHEN** amounts appear one above another in a column
- **THEN** their digits line up vertically, so two amounts can be compared by length alone

#### Scenario: A new screen is added later

- **WHEN** a screen is written after this requirement is in force
- **THEN** it takes its colour, typeface, radius and density from the shared definition rather than restating them
