## Why

Signing a tenancy requires picking the person responsible from a list of customers who already exist. A new tenant does not exist yet — so the owner has to leave the form, open the customers screen, add them, come back, and start again. The form they abandoned does not remember what they had typed.

That is the common case, not the edge one. Most people signing a tenancy are signing their first.

## What Changes

- The signatory field becomes one where the owner **types a name**, and matching existing customers appear beneath as they type. Picking one uses that person, exactly as today.
- Typing somebody the list does not have offers to add them, with a phone number, without leaving the form.
- The phone number is **required for a new person here**, though the customers screen keeps it optional. It is the only thing the system matches a returning tenant by; a signatory recorded without one becomes a second person of the same name the next time they rent.
- A new person is created through the customers endpoint, then the lease through the lease endpoint. Two calls, orchestrated by this screen.

### The case this change is really about

`POST /customers` answers **200** when the phone number already belongs to a customer. It returns that person, and **the name that was typed is discarded**. So an owner who types a new name against a number already on file gets somebody else's record — with a different name — attached to the tenancy.

It cannot be detected afterwards by comparing names, because it fails exactly when the existing person happens to share the name. The screen therefore SHALL stop and show who the number belongs to, rather than proceeding.

## Deliberately not changed

**The API.** Creating a person and signing a tenancy stay two endpoints, orchestrated here — which is what this project already decided for lease onboarding. An endpoint that did both would need its own transaction, its own error shape, and a second place where a tenant can be created.

**Phone being optional on the customers screen.** Occupants who are not the signatory — children — legitimately have none. This change tightens the rule only where the person is taking responsibility for a tenancy.

## Capabilities

### Modified Capabilities

- `web-leases`: the person responsible can be created from the signing form rather than found beforehand.

## Impact

- `frontend/src/features/leases/LeaseFormDialog.tsx` and its schema.
- Reads `useCustomers` for suggestions and `useCreateCustomer` to add one; both exist.
- No backend change.
