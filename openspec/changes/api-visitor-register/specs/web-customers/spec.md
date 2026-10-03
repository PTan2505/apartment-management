## MODIFIED Requirements

### Requirement: The owner can add a customer

The screen SHALL let the owner add a customer by entering a name and, optionally, a phone number and an identity-document number. A name SHALL be required; neither of the others SHALL be, because a person such as a child occupant may have no telephone, and an owner entering a tenancy from an old paper file may never have been given the document number.

The identity-document field SHALL say what it is for — it is the number copied onto the residence paperwork — because an owner who has already uploaded photographs of the card will otherwise read it as the same thing asked twice.

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

#### Scenario: Adding a customer with an identity-document number

- **WHEN** an owner adds a customer entering a name and an identity-document number
- **THEN** the customer is created carrying that number

#### Scenario: The identity-document field explains itself

- **WHEN** an owner opens the add form
- **THEN** the identity-document field says it is the number used on the residence paperwork

### Requirement: The owner can correct a customer's details

The screen SHALL let the owner edit an existing customer's name, phone number and identity-document number, including adding any of them to a customer recorded without one, and clearing a document number that was entered wrongly.

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

#### Scenario: The edit form opens with the document number already in it

- **WHEN** an owner opens the edit form for a customer carrying an identity-document number
- **THEN** that number is already in the form

#### Scenario: Clearing a wrongly entered document number

- **WHEN** an owner empties the identity-document field and saves
- **THEN** the change is saved and the customer carries no document number

