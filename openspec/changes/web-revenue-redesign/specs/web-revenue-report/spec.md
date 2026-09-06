## MODIFIED Requirements

### Requirement: Money billed and money arrived are kept apart

The application SHALL present the figures keyed on the month an invoice was **issued** separately from the figure keyed on the dates money actually **arrived**, and SHALL say what each counts.

They are the reason this screen needs designing rather than tabulating. An invoice issued in March and paid in May counts toward March in `settled` and toward May in `received`. Placed adjacent in one row of figures they read as a contradiction, and a reader who spots it concludes that one of them is wrong — which is worse than not showing it, because it discredits the rest of the report too.

The application SHALL NOT present them as a pair to be compared or subtracted. There is no meaningful arithmetic between an accrual figure and a cash figure over the same month.

**This holds against redesign.** The separation is not a layout preference that a later visual direction may overrule: it is the correctness of the screen. A design that has no place for the cash figure SHALL NOT be adopted by dropping the figure, and a design that would seat it beside the billed ones SHALL NOT be adopted by moving it there. Where the two conflict, the design gives way.

Where the application charts these figures over time, a series SHALL carry only one of the two keyings, and the chart SHALL say which. Two series drawn against a shared month axis assert that they are measured the same way, and a cash series drawn beside an accrual one makes that assertion silently.

#### Scenario: The two are visibly distinct

- **WHEN** the owner reads a month's figures
- **THEN** the money-arrived figure is presented apart from the billed and settled figures, and each states what it counts

#### Scenario: An invoice billed in one month and paid in another

- **WHEN** an invoice issued in March is paid in May
- **THEN** it appears in March's settled figure and in May's arrived figure, and the screen does not present that as a discrepancy

#### Scenario: A chart over months

- **WHEN** the screen charts figures across months
- **THEN** the series drawn are all keyed the same way, and the chart states which keying it is showing

## ADDED Requirements

### Requirement: The screen leads with what the owner came to find out

The application SHALL present, ahead of any table, what was billed, what has been collected, what is still owed, and what was spent — each stated with the share of the billed total it represents.

A reader arriving at this screen has one of a few questions, and every one of them is answered by those four figures. Reaching them by scanning a table of months is the reader doing the screen's work; stating a proportion they would otherwise divide out by hand is the difference between a figure that is read and a figure that is computed.

The application SHALL state the profit — what was billed less what was spent — rather than leaving it to be subtracted, and SHALL show the subtraction that produced it so the figure can be checked.

The profit SHALL be presented truthfully when it is negative. A month that cost more than it earned is a fact about the business, not a failure of the screen, and SHALL NOT be hidden, clamped to zero, or styled as an error.

#### Scenario: The summary leads

- **WHEN** the owner opens the revenue screen
- **THEN** the billed, collected, outstanding and spent figures are shown before any table, each with the share it represents

#### Scenario: The profit is stated

- **WHEN** the report covers a range with both revenue and costs
- **THEN** the screen states the profit and the subtraction it came from

#### Scenario: A loss

- **WHEN** costs exceed what was billed
- **THEN** the loss is shown as a negative figure, plainly, and not as an error

### Requirement: The months are shown as a shape, not only as rows

The application SHALL chart the months in the chosen range, so that a direction over time is visible without the reader comparing rows.

A run of falling collection is the thing this screen exists to catch early, and it is exactly what a table of figures conceals: reading it out of rows requires the reader to already suspect it. A chart states it.

The chart SHALL cover the range the report was asked for, and SHALL say what period it covers and in what unit its figures are drawn.

Where a chart cannot honestly be drawn — a range too short to show a direction — the application SHALL say so rather than render a chart with one or two bars that implies a trend it cannot support.

#### Scenario: A range of several months

- **WHEN** the owner reads a report covering several months
- **THEN** those months are charted, with the period and the unit stated

#### Scenario: A range too short to have a shape

- **WHEN** the range covers a single month
- **THEN** the screen says there is not enough of a period to chart rather than drawing one

### Requirement: A share is shown as a share of something named

Where the application presents a figure as a proportion, it SHALL name what the proportion is taken of.

A bare percentage beside an amount is an invitation to guess its denominator, and the guesses differ: a collection figure at 78% may be 78% of what was billed this period or 78% of everything ever owed, and an owner acting on the wrong reading acts wrongly.

#### Scenario: A collected figure with a share

- **WHEN** the collected amount is shown with a percentage
- **THEN** the screen names what that percentage is a share of

#### Scenario: Expense categories with shares

- **WHEN** expenses are broken down by category with shares
- **THEN** the shares are stated as parts of the total spending, which is itself shown
