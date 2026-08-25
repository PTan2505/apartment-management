## Purpose

The owner's screen for what their buildings earned, what they cost, and what money actually arrived. It is the one screen that answers a question rather than recording something, and its central difficulty is keeping two figures apart that look identical side by side and answer different questions.

## ADDED Requirements

### Requirement: The owner can read what a range of months earned and cost

The application SHALL let the owner choose a range of months, optionally narrowed to particular buildings, and SHALL show for each month what was billed, what has been settled, what is still owed, what was spent, and the net of each against spending.

This is the question every other screen exists to make answerable, and until now it had no answer reachable from anywhere.

The range SHALL default to something immediately useful rather than empty. A screen that opens blank asks the reader to specify a question before it will answer one, and the question they almost always have is "the last few months".

A month with no activity SHALL be shown as zero rather than omitted. A gap in a table reads as data that failed to load; a zero is a statement about that month, and a building that earned nothing in April needs to be able to say so.

#### Scenario: Reading a range

- **WHEN** the owner opens the revenue screen
- **THEN** a range of recent months is already shown, with each month's billed, settled, outstanding, spent and net figures

#### Scenario: Narrowing to buildings

- **WHEN** the owner narrows the report to particular buildings
- **THEN** only those buildings' figures are shown, each reported separately

#### Scenario: A month with nothing in it

- **WHEN** a month in the range had no invoices and no costs
- **THEN** it is shown with zeroes rather than left out

#### Scenario: A range that is one month

- **WHEN** the owner chooses a range beginning and ending in the same month
- **THEN** that month is reported

### Requirement: Money billed and money arrived are kept apart

The application SHALL present the figures keyed on the month an invoice was **issued** separately from the figure keyed on the dates money actually **arrived**, and SHALL say what each counts.

They are the reason this screen needs designing rather than tabulating. An invoice issued in March and paid in May counts toward March in `settled` and toward May in `received`. Placed adjacent in one row of figures they read as a contradiction, and a reader who spots it concludes that one of them is wrong — which is worse than not showing it, because it discredits the rest of the report too.

The application SHALL NOT present them as a pair to be compared or subtracted. There is no meaningful arithmetic between an accrual figure and a cash figure over the same month.

#### Scenario: The two are visibly distinct

- **WHEN** the owner reads a month's figures
- **THEN** the money-arrived figure is presented apart from the billed and settled figures, and each states what it counts

#### Scenario: An invoice billed in one month and paid in another

- **WHEN** an invoice issued in March is paid in May
- **THEN** it appears in March's settled figure and in May's arrived figure, and the screen does not present that as a discrepancy

### Requirement: The breakdowns say what they are a part of

The application SHALL show costs broken down by kind, and owner-named charges broken down by kind.

The charge breakdown SHALL be presented as a **part of** what was billed, never as an addition to it. It is a partition of a figure already shown, and a reader who adds it on top counts the same money twice — the exact mistake the API's own shape was designed to prevent, which a screen can reintroduce in one careless heading.

#### Scenario: Costs by kind

- **WHEN** the owner reads the report
- **THEN** what was spent is broken down by kind, and the parts sum to the total spent

#### Scenario: Charges by kind are a partition

- **WHEN** the owner reads the breakdown of owner-named charges
- **THEN** it is presented as part of what was billed, not as a separate total to be added to it

### Requirement: What is still owed leads to who owes it

Where a range shows money still outstanding, the application SHALL offer a way to see which bills those are.

"Who has not paid" is the question a reader of this figure asks immediately afterwards, and the answer already exists as a filter on the invoices screen. A report that states a problem and offers no route to acting on it makes the reader go and find the route themselves, every time.

#### Scenario: Following the outstanding figure

- **WHEN** a report shows money outstanding
- **THEN** the owner can reach the unpaid bills from there

#### Scenario: Nothing outstanding

- **WHEN** a report shows nothing outstanding
- **THEN** no such offer is made, because there is nothing to look at

### Requirement: The report adapts to the viewport

The application SHALL present the report on a phone as usably as on a desktop.

A table of six figures per month does not fit a narrow screen, and a table that has to be scrolled sideways to read a row is a table whose rows cannot be read.

#### Scenario: Reading on a phone

- **WHEN** the owner opens the report on a narrow viewport
- **THEN** each month's figures are readable without scrolling the page sideways
