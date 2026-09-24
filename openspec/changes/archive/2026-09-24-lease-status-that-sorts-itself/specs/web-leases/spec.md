## ADDED Requirements

### Requirement: The tenancy list shows the six states and puts the pressing ones first

The list SHALL distinguish, on every row, whether a tenancy is overdue, due soon, running, not yet started, finished or cancelled — and SHALL order itself so the first of those come first.

Three of the six could not be seen at all. A tenancy whose term ran out read as "Đang thuê" while it held its room and could no longer be billed. One ending next week read the same as one ending next year. One signed for next month read as though somebody were living there already.

The order SHALL be: overdue, due soon, running — those three by how little time is left — then not yet started, then finished, then cancelled. Within the remaining groups the most recently signed SHALL come first.

Ordering SHALL be requested from the API rather than applied to the page. The list is paginated, and reordering the rows that happen to be on screen produces a list that looks ordered and is not.

#### Scenario: What needs doing is at the top

- **WHEN** the owner opens the tenancy list
- **THEN** overdue tenancies are at the top, followed by those ending soonest

#### Scenario: Every row says which state it is in

- **WHEN** the owner reads a row
- **THEN** it says whether the tenancy is overdue, ending soon, running, not yet started, finished or cancelled

#### Scenario: The order comes from the API

- **WHEN** the list is shown
- **THEN** the rows arrive in that order rather than being sorted in the browser

### Requirement: The owner can filter tenancies by any of the six states

The status filter SHALL offer all six states, and SHALL replace the "Cần xử lý" switch.

That switch was a filter pretending to be a status: it found the tenancies whose term had run out, while the row itself said nothing about them. Now that the row says it, the filter is one value among the others rather than a control of its own.

#### Scenario: Filtering to overdue

- **WHEN** the owner filters to overdue tenancies
- **THEN** only those whose term has ended with no move-out recorded are listed

#### Scenario: Filtering to those ending soon

- **WHEN** the owner filters to tenancies ending soon
- **THEN** only running tenancies within two weeks of their end are listed

#### Scenario: The old switch is gone

- **WHEN** the owner looks at the filters
- **THEN** there is no separate "Cần xử lý" control, and its question is answered by the status filter

#### Scenario: The filter is reachable on a phone

- **WHEN** the owner opens the tenancy list on a phone
- **THEN** the status filter is on the screen and can be used, rather than clipped off the side of a row that does not scroll

### Requirement: The tenancy screen counts what is overdue and what is running

The screen SHALL show, above the list, how many tenancies are overdue and how many are running.

A count answers a question the list cannot: whether there is anything to do at all. An owner scanning a page of twenty rows to work out that three need attention is doing by eye what a number does at a glance — and the number is right even when the answer is on page four.

Each count SHALL be reachable: selecting it SHALL filter the list to what it counts.

#### Scenario: The counts are shown

- **WHEN** the owner opens the tenancy screen
- **THEN** the number of overdue tenancies and the number running are shown above the list

#### Scenario: A count filters the list

- **WHEN** the owner selects the overdue count
- **THEN** the list is filtered to overdue tenancies

#### Scenario: Nothing overdue

- **WHEN** no tenancy is overdue
- **THEN** the count says zero rather than disappearing, so the absence is an answer rather than a missing control

### Requirement: A tenancy that has not ended keeps everything an owner can do to it

Every action on the tenancy screen that was offered while a tenancy was running SHALL stay offered for a tenancy that is overdue, ending soon or not yet started — editing its terms, renewing it, recording a move-out, and naming a signatory who is missing.

Those four states were one state until now, and each control asked for it by name. Splitting the state without splitting the question would have taken "Kết thúc hợp đồng" off the one tenancy that most needs it: the one whose term has already run out and whose room is still being held.

#### Scenario: An overdue tenancy can still be closed

- **WHEN** the owner opens a tenancy whose term has run out
- **THEN** it can still be renewed, edited, and recorded as moved out

#### Scenario: A tenancy signed for a future date can still be edited

- **WHEN** the owner opens a tenancy that has not started yet
- **THEN** its terms can still be edited and it can still be cancelled or closed
