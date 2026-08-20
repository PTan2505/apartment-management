## Purpose

Covers managing customers from the browser: finding them by name or phone number, adding them, and correcting their details — including telling the owner honestly when a phone number they entered already belongs to someone.

## Requirements

### Requirement: The owner can see the customers on file

The screen at `/customers` SHALL list the customers the owner has on file, replacing the placeholder that stands there now.

Each customer SHALL be shown with their name and phone number. A customer with no phone number SHALL be shown with a dash in its place rather than blank space, so that an absent number reads as absent rather than as a rendering fault.

The list SHALL be paginated, following the shared paginated response the API returns rather than fetching every customer at once.

While the list is loading for the first time the screen SHALL say so, and if it fails it SHALL say that instead — an empty table and a failed request SHALL NOT look alike.

When there are no customers at all, the screen SHALL say so and offer to add one, rather than presenting an empty table with no explanation.

#### Scenario: Listing customers

- **WHEN** an owner opens the customers screen
- **THEN** their customers are listed with each one's name and phone number

#### Scenario: A customer with no phone number

- **WHEN** a listed customer has no phone number recorded
- **THEN** a dash is shown in place of the number

#### Scenario: Paging through customers

- **WHEN** there are more customers than fit on one page
- **THEN** the list is paged, and moving between pages shows the other customers

#### Scenario: The list is loading

- **WHEN** the customers are still being fetched for the first time
- **THEN** the screen indicates that it is loading rather than showing an empty list

#### Scenario: The list fails to load

- **WHEN** fetching the customers fails
- **THEN** the screen reports the failure and offers to try again, and does not present the failure as an empty list

#### Scenario: No customers at all

- **WHEN** the owner has no customers on file
- **THEN** the screen says so and offers to add one

### Requirement: The owner can find a customer by name or phone

The screen SHALL offer a single search field that matches a customer by either their name or their phone number, because the owner looking someone up knows one or the other and should not have to say which.

A name SHALL be found whether or not the search carries diacritics and whatever letter casing is used, so that searching `nguyen van a` finds `Nguyễn Văn A`. The owner SHALL NOT have to type diacritics to find a person whose name has them.

The search SHALL report a settled value rather than every keystroke, so that typing a name does not issue a request per character.

The search SHALL be reflected in the page's address, so that a searched list can be reloaded, kept on returning to the screen, and shared. Changing the search SHALL return to the first page, because the page a result sat on under the previous search means nothing under the new one.

Refining a search SHALL NOT leave the browser's back control walking backwards through the text one character at a time.

When a search matches nothing the screen SHALL say that nothing matched and offer to clear the search, which is a different state from having no customers at all.

#### Scenario: Searching by name

- **WHEN** an owner searches by part of a customer's name
- **THEN** the list shows the customers whose names contain that text

#### Scenario: Searching a name without diacritics

- **WHEN** an owner searches `nguyen van a` and a customer is recorded as `Nguyễn Văn A`
- **THEN** that customer is listed

#### Scenario: Searching regardless of casing

- **WHEN** an owner searches using different letter casing from the recorded name
- **THEN** the matching customers are still listed

#### Scenario: Searching by phone number

- **WHEN** an owner searches by part of a customer's phone number
- **THEN** that customer is listed

#### Scenario: The search survives a reload

- **WHEN** an owner searches and then reloads the page
- **THEN** the same search is still applied and the same customers are listed

#### Scenario: Searching returns to the first page

- **WHEN** an owner is on a later page and then changes the search
- **THEN** the list returns to the first page of the new results

#### Scenario: A search that matches nothing

- **WHEN** an owner searches for text that matches no customer
- **THEN** the screen says nothing matched and offers to clear the search

### Requirement: The owner can add a customer

The screen SHALL let the owner add a customer by entering a name and, optionally, a phone number. A name SHALL be required; a phone number SHALL NOT be, because a person such as a child occupant may have none.

Adding a customer has three distinct outcomes and the screen SHALL tell them apart, because they are not variations of success:

**A new customer was created.** The screen SHALL confirm it by name, close the form, and show the new customer in the list — including when they fall on a page other than the one being viewed, so that adding someone never appears to have done nothing.

**The phone number already belongs to a customer.** The API returns that person and creates nobody; the name just entered is discarded. The screen SHALL say that the number already belongs to someone, SHALL name who, and SHALL state that the entered name was not saved. It SHALL NOT report this as a successful creation. The form SHALL stay open with the entered values intact, so that an owner who simply mistyped the number can correct it rather than retype everything.

**The phone number belongs to an owner account.** The API rejects it. The screen SHALL report that the number belongs to an owner account and keep the form open.

Validation messages SHALL appear against the field they concern, and the form SHALL NOT be submitted while a required value is missing.

#### Scenario: Adding a new customer

- **WHEN** an owner adds a customer whose phone number is not already on file
- **THEN** the customer is created, the form closes, and the new customer is confirmed by name

#### Scenario: Adding a customer with no phone number

- **WHEN** an owner adds a customer entering only a name
- **THEN** the customer is created

#### Scenario: A new customer that lands on another page

- **WHEN** an owner adds a customer and that customer belongs on a page other than the one being viewed
- **THEN** the screen shows the page the new customer is on, so the addition is visibly reflected

#### Scenario: The phone number already belongs to a customer

- **WHEN** an owner adds a customer using a phone number that already belongs to another customer
- **THEN** the screen names the person that number belongs to, states that the entered name was not saved, and does not report a customer as having been created

#### Scenario: The form survives a phone number clash

- **WHEN** the entered phone number already belongs to another customer
- **THEN** the form stays open with the entered values still in it

#### Scenario: The phone number belongs to an owner account

- **WHEN** an owner adds a customer using a phone number that belongs to an owner account
- **THEN** the screen reports that the number belongs to an owner account and the form stays open

#### Scenario: A missing name

- **WHEN** an owner submits the form without a name
- **THEN** the form reports that a name is required, against the name field, and does not submit

### Requirement: The owner can correct a customer's details

The screen SHALL let the owner edit an existing customer's name and phone number, including adding a phone number to a customer recorded without one.

The form SHALL open with the customer's current values already in it, so that correcting one field does not mean retyping the other.

A phone number already in use by someone else SHALL be reported as such and the form SHALL stay open, rather than the change appearing to have been saved.

After a successful edit the list SHALL show the updated details without the owner having to reload the screen.

#### Scenario: Editing a customer

- **WHEN** an owner edits a customer and saves valid changes
- **THEN** the changes are saved and the list shows the updated details

#### Scenario: The edit form opens with current values

- **WHEN** an owner opens the edit form for a customer
- **THEN** the customer's current name and phone number are already in the form

#### Scenario: Adding a phone number to a customer who had none

- **WHEN** an owner sets a phone number on a customer recorded without one, and that number is not in use
- **THEN** the change is saved

#### Scenario: Editing to a phone number already in use

- **WHEN** an owner changes a customer's phone number to one already belonging to someone else
- **THEN** the screen reports that the number is already in use and the form stays open

#### Scenario: A renamed customer is findable by their new name

- **WHEN** an owner renames a customer and then searches for the new name
- **THEN** that customer is listed

### Requirement: A customer's row offers only what the API supports

A customer SHALL be presented with editing as its only action.

The screen SHALL NOT offer to delete, retire, or deactivate a customer, because the API supports none of those. An action that cannot succeed SHALL NOT be shown.

#### Scenario: Editing is the only action

- **WHEN** an owner views a customer in the list
- **THEN** editing is offered and no delete, retire, or deactivate action is present

### Requirement: The customers screen adapts to the viewport

Customers SHALL be presented as a table on a wide viewport and as per-customer cards on a narrow one.

Both presentations SHALL show the same customers and offer the same actions, and neither SHALL cause the page to scroll horizontally at any supported width.

#### Scenario: Table on a wide viewport

- **WHEN** an owner views customers on a wide viewport
- **THEN** they are presented as a table

#### Scenario: Cards on a narrow viewport

- **WHEN** an owner views customers on a narrow viewport
- **THEN** they are presented as per-customer cards rather than a narrowed table

#### Scenario: The same actions in both presentations

- **WHEN** an owner views customers at either width
- **THEN** the same customers are shown and the same actions are available for each

#### Scenario: No horizontal scrolling

- **WHEN** an owner views customers at any supported width down to a small phone
- **THEN** the page does not scroll horizontally
