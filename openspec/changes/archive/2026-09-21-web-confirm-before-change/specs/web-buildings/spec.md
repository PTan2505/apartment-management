## REMOVED Requirements

### Requirement: The owner can take a building out of service and back

**Reason**: It required that restoring a building NOT be confirmed, with the reasoning that restoring is not destructive. That decision is being reversed, and a scenario asserting "restored without a confirmation step" cannot stand beside one asserting the opposite.

**Migration**: None. The same menu offers the same two actions; restoring now asks first. Replaced by "Taking a building out of service and putting it back are both confirmed" below, which keeps every other scenario of the removed requirement.

## ADDED Requirements

### Requirement: Taking a building out of service and putting it back are both confirmed

The application SHALL let the owner retire a building and restore a retired one, and SHALL confirm both before sending anything.

Retiring, because a retired building disappears from the default list and from the location choices. Restoring, because it returns a building to the lists, the filters and the places a tenancy can be signed — a change to what the rest of the application offers, made from a menu item beside ordinary ones. Reversible is not the same as harmless.

When the API refuses to retire a building because one of its rooms still has an active lease, the screen SHALL report the reason the API gave, rather than a generic failure. This is an expected outcome of a reasonable action, not a fault.

The screen SHALL NOT suggest that retiring a building also retires its rooms, because it does not.

#### Scenario: Retiring a building

- **WHEN** an owner retires a building and confirms
- **THEN** the building is marked retired and leaves the default list

#### Scenario: Retiring is confirmed first

- **WHEN** an owner starts to retire a building and does not confirm
- **THEN** the building remains in service

#### Scenario: Retiring a building that still has a tenant

- **WHEN** an owner confirms retiring a building whose room still has an active lease
- **THEN** the screen reports the reason the API gave, and the building remains in service

#### Scenario: Restoring a retired building

- **WHEN** an owner restores a retired building and confirms
- **THEN** it is marked in service again and reappears in the default list

#### Scenario: Restoring is confirmed first

- **WHEN** an owner starts to restore a retired building and does not confirm
- **THEN** no request is sent and the building remains retired


### Requirement: A change to a building's rates is confirmed before it is saved

The application SHALL ask the owner to confirm saving a building whose electricity or water rate has changed, and SHALL show each changed rate as its previous value and its new one.

The confirmation SHALL say that new rates apply only to tenancies and invoices made from now on, because that is the question an owner asks at exactly this moment and the answer is not visible on the form.

Saving a building whose rates are unchanged SHALL NOT be confirmed, however many other details were edited. A rate is what later billing reads; a name or an address is not.

#### Scenario: Saving a changed rate

- **WHEN** an owner changes a building's electricity or water rate and saves
- **THEN** a confirmation lists each changed rate as old and new, and nothing is sent until it is confirmed

#### Scenario: Saving other details

- **WHEN** an owner changes a building's name or address but neither rate and saves
- **THEN** the change is saved without a confirmation step

#### Scenario: The confirmation says what the new rate applies to

- **WHEN** an owner is asked to confirm a changed rate
- **THEN** the confirmation says the new rate applies to tenancies and invoices made from now on

#### Scenario: Declining keeps the form

- **WHEN** an owner declines the confirmation
- **THEN** the form is still open with the rates they entered, and nothing was sent
