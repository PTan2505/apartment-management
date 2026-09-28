## ADDED Requirements

### Requirement: A new tenancy takes up its building's default service fees

Creating a lease SHALL attach every service fee its building offers and has marked as
applying to new tenancies, effective from the lease's start date, in the same operation
that creates the lease and its move-in invoice.

Failing to attach them SHALL fail the whole creation, for the same reason a missing
move-in invoice does: a tenancy that quietly lacks a charge everybody else pays is money
the owner will not learn about until they compare two bills.

The move-in invoice SHALL NOT charge them. It carries the deposit and the first month's
rent, and a service fee belongs to the months it covers.

#### Scenario: Signing where the building has defaults

- **WHEN** a lease is created in a building with a default rubbish fee
- **THEN** the lease holds that fee from its start date, and the next monthly invoice charges it

#### Scenario: Nothing marked as default

- **WHEN** a lease is created in a building with no default fees
- **THEN** it holds none, exactly as before

#### Scenario: The move-in bill

- **WHEN** a lease is created in a building with default fees
- **THEN** its move-in invoice charges the deposit and first month's rent only
