## Context

See proposal.md — Why.

`LeaseFormDialog` collects the lease and posts it with a `signatoryId`. The pieces needed already exist: `useCustomers({ search })` lists and filters, and `useCreateCustomer` resolves with `{ created, customer }` — the distinction the API's 200-vs-201 carries.

## Goals / Non-Goals

Naming the person by typing, and adding one without leaving. Not: changing the API, and not relaxing anything on the customers screen.

## Decisions

### One control, two outcomes

An MUI `Autocomplete` with `freeSolo`: the value is either a customer that was picked or free text that is not yet anybody. A second "add a customer" dialog on top of this one would be the obvious alternative and is worse — it is the detour this change exists to remove, moved inside the form.

The phone field appears only once the typed name matches nobody. Showing it always would ask for a number that is already on file for the common case of picking somebody.

### Creation happens on submit, not on typing

The person is created when the owner signs, not when they finish typing a name. Creating on blur would leave a customer behind every time somebody opens the form, changes their mind and closes it.

The consequence is that the two calls are not atomic: the customer can be created and the lease then fail — the room taken in the meantime, for instance. That is the right way round. A person who exists without a tenancy is a record the owner can use; a tenancy without its signatory cannot exist at all, and the lease endpoint requires the id.

Where the lease fails after the person was created, the screen SHALL keep the created person selected rather than starting over, so retrying does not make a second one.

### The 200 is the whole design

`created: false` means the phone matched and the typed name was thrown away. The screen stops there and names the person it matched.

Deliberately NOT auto-accepted. The case it protects is a returning tenant whose name is spelled differently — which is exactly the case where accepting silently attaches a tenancy to a record the owner did not read.

Deliberately not a refusal either: a returning tenant IS the person, and making the owner go and find them by hand would restore the detour.

### 409 is its own message

The phone belonging to an owner account is a different situation from it belonging to a customer, and the API separates them. Reporting both as "this number is taken" would send an owner looking for a customer who does not exist.

## Risks / Trade-offs

- **A customer created for a lease that then fails.** → Kept selected so a retry reuses them; and a person with no tenancy is a usable record, unlike the reverse.
- **Free text that is neither picked nor completed.** A name typed with no phone and no selection is not a person. → The form refuses on submit and says which of the two is missing.
- **Autocomplete search cost.** → Filters the customers already fetched for the form rather than querying per keystroke; the list is small and already loaded.

## Migration Plan

None. No API change, no persisted state.

## Open Questions

None. The phone requirement was put to the owner before this was written.
