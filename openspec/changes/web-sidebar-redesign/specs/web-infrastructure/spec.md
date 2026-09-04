## ADDED Requirements

### Requirement: The navigation says who is signed in, and offers the way out

The shell SHALL show the signed-in person in both forms of the navigation: their name, their role in the reader's language, and the phone number they sign in with. Sign-out SHALL be reachable from there.

Three facts rather than one, because each answers a different question. The name answers "is this my account". The role answers "why can I see this" — the application will eventually let a tenant sign in, and a screen that never says which kind of account is looking is one where the answer has to be guessed from what happens to be on it. The phone answers "which account", and it is the only one of the three that is guaranteed distinct: two owners may share a name, and none share the number they sign in with.

The role SHALL be shown in Vietnamese, not as the value the system stores. `owner` is a token in a database column; `Chủ nhà` is what a person is.

Where a fact is absent, the shell SHALL say so in Vietnamese rather than leaving a gap. A blank where a phone number belongs is indistinguishable from a screen that failed to load one.

Sign-out SHALL NOT be reachable only from a navigation that is hidden by default. On a narrow viewport the navigation lives behind a control, and a person who wants to leave should not have to open the navigation to do it.

#### Scenario: Reading who is signed in, wide viewport

- **WHEN** the owner looks at the navigation on a wide viewport
- **THEN** their name, their role in Vietnamese, and their phone number are all visible without any action

#### Scenario: Reading who is signed in, narrow viewport

- **WHEN** the owner opens the navigation on a narrow viewport
- **THEN** the same three facts are shown there

#### Scenario: An account with no phone number recorded

- **WHEN** the signed-in account has no phone number
- **THEN** the shell says so in Vietnamese, rather than showing an empty space

#### Scenario: Leaving from a narrow viewport

- **WHEN** the owner wants to sign out on a narrow viewport
- **THEN** they can do so without first opening the navigation

## MODIFIED Requirements

### Requirement: The application shell adapts its navigation to viewport width

The application SHALL present a persistent shell containing navigation and a content area, and that navigation SHALL take a different form on wide and narrow viewports.

On a wide viewport the navigation SHALL be permanently visible alongside the content. On a narrow viewport it SHALL be hidden by default, opened by an explicit control, presented over the content, and dismissed both by selecting a destination and by dismissing it directly — so that navigating never leaves it obscuring the content it navigated to.

The shell SHALL indicate which destination is currently active in both forms. That indication SHALL NOT rely on colour alone at a strength a reader could mistake for the row merely being under the pointer: the current destination and a hovered one answer different questions, and a treatment that makes them look alike answers neither.

#### Scenario: Wide viewport shows navigation permanently

- **WHEN** the application is viewed on a wide viewport
- **THEN** the navigation is visible alongside the content without any action, and no control to open it is offered

#### Scenario: Narrow viewport hides navigation behind a control

- **WHEN** the application is viewed on a narrow viewport
- **THEN** the navigation is not visible, the content occupies the full width, and a control to open the navigation is offered

#### Scenario: Opening and dismissing navigation on a narrow viewport

- **WHEN** the control is used on a narrow viewport
- **THEN** the navigation appears over the content, and dismissing it directly returns to the content unchanged

#### Scenario: Selecting a destination on a narrow viewport dismisses the navigation

- **WHEN** a destination is selected from the opened navigation on a narrow viewport
- **THEN** the application navigates to that destination and the navigation closes

#### Scenario: Resizing across the breakpoint

- **WHEN** the viewport is resized from narrow to wide while the navigation is open
- **THEN** the navigation settles into its permanent form rather than remaining as an overlay

#### Scenario: The active destination is indicated

- **WHEN** the application is showing a destination
- **THEN** that destination is distinguished from the others in the navigation, in both the wide and narrow forms

#### Scenario: The current destination is not mistakable for a hovered one

- **WHEN** the pointer rests on a destination that is not the current one
- **THEN** the two are distinguishable from each other at a glance

#### Scenario: Content never scrolls horizontally

- **WHEN** the application is viewed at any viewport width down to a small phone
- **THEN** the shell itself does not scroll horizontally, and any content too wide to fit scrolls within its own bounds
