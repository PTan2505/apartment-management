## ADDED Requirements

### Requirement: The billing screen shows the round as it is worked

While the owner is entering readings, the application SHALL show what each entry means and how much of the round is done.

Each row SHALL show the consumption its entry implies — the difference between the reading typed and the reading it opens from — as it is typed. That difference is what gets billed, and it is the figure an owner can sanity-check against a room they know. Requiring them to subtract two four-digit numbers in their head to reach it makes the check something they will stop doing.

Each row SHALL show whether it is entered, still waiting, or in error, so the state of the round reads down a column instead of being inferred from which fields happen to look filled.

The screen SHALL show how many rooms have been entered out of how many are outstanding. An owner interrupted mid-round returns to a screen that says where they were.

**None of this SHALL become a condition on issuing.** The screen may say three rooms are still waiting; it SHALL NOT withhold the seven that are ready. A round the owner cannot finish today is still a round in which seven rooms were billed.

Readings SHALL carry their unit wherever they are shown. Consumption, an opening reading and a rate are three different kinds of number, and a column of bare integers invites reading one as another.

#### Scenario: Consumption appears as the reading is typed

- **WHEN** the owner types a closing reading into a row
- **THEN** that row shows the consumption it implies, without the owner subtracting anything

#### Scenario: The state of the round is visible

- **WHEN** the owner has entered some rooms and not others
- **THEN** each row shows which of the two it is, and the screen says how many of the outstanding rooms are entered

#### Scenario: An incomplete round still issues

- **WHEN** some rooms are entered, some are empty, and one is in error
- **THEN** the entered rooms can still be issued, and nothing about the incomplete ones prevents it

#### Scenario: A room in error is distinguishable at a glance

- **WHEN** a row's reading is below the one it opens from
- **THEN** that row is distinguishable from a valid one without reading its message

### Requirement: A refusal the owner cannot act on is not offered again

When issuing a row fails, the screen SHALL distinguish a refusal from a failure to deliver, and SHALL offer the control again only where pressing it could produce a different outcome.

A rejection is the server's verdict on exactly the reading in the field. Leaving the control live invites the owner to produce that same refusal as many times as they have patience for, which is a screen wasting somebody's afternoon politely. A request that never arrived is the opposite case and SHALL stay retryable.

The block SHALL lift as soon as the reading is edited, so the owner is never stranded on a row.

A refused row SHALL NOT be counted among the rooms entered, and SHALL NOT be shown as entered. It produced no invoice, and reporting it as done contradicts the refusal displayed on the same row.

The screen SHALL NOT describe a refusal as a fault in the reading unless it is one. A reading below the one the row opens from is a data error; a month already billed says nothing about what was typed.

#### Scenario: A rejected reading cannot be resubmitted unchanged

- **WHEN** the server refuses to issue a row, on grounds that the same reading would meet again
- **THEN** that row's control refuses further attempts, and the reason is shown in the reader's language

#### Scenario: Editing the reading makes the row issuable again

- **WHEN** the owner changes the reading on a refused row
- **THEN** that row can be issued again

#### Scenario: A refused row is not counted as done

- **WHEN** a row has been refused by the server
- **THEN** it is not included in the count of rooms entered, and is not shown as entered

#### Scenario: A failure that never reached the server stays retryable

- **WHEN** issuing a row fails because the request did not arrive
- **THEN** the owner can press it again

### Requirement: A reading can be confirmed from the keyboard

The owner SHALL be able to issue the row they are typing without leaving the keyboard.

Readings are entered from a sheet of paper, ten or twenty in a sitting. A round trip to the mouse between each one is paid once per room, and it is the reason a screen that is merely usable is not the same as one somebody can get through.

Confirming from the keyboard SHALL do exactly what the row's own control does, including refusing a reading the screen has already rejected. Two ways to do one thing that behave differently is worse than one way.

#### Scenario: Confirming the row being typed

- **WHEN** the owner has typed a valid reading and confirms it from the keyboard
- **THEN** that row's invoice is issued, exactly as if its own control had been used

#### Scenario: Confirming a reading the screen has rejected

- **WHEN** the owner confirms from the keyboard a reading below the one the row opens from
- **THEN** nothing is issued, and the screen says why — as it does for the row's own control
