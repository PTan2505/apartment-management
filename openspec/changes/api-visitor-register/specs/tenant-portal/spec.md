## ADDED Requirements

### Requirement: The portal registers a visitor

The portal token SHALL authorise registering a visitor against its own tenancy, listing
that tenancy's registrations, and cancelling one.

Nothing SHALL ask the tenant which room or which tenancy. The token already says, exactly
as it does for a bill and for a fault report.

A portal token SHALL NOT reach any other tenancy's registrations, and SHALL NOT reach
staff-only facilities — it remains the public, link-only surface it is, and registering a
visitor grants nothing beyond it.

A cancelled or finished registration SHALL remain visible to the tenant, so they can see
what they have filed.

#### Scenario: A tenant registers somebody

- **WHEN** a tenant opens their link and registers a visitor with dates and an ID number
- **THEN** it is recorded against their tenancy, and nothing asked them which room they live in

#### Scenario: Reading their own

- **WHEN** a tenant lists registrations through their link
- **THEN** they see only their own tenancy's

#### Scenario: Another tenancy's

- **WHEN** a portal token is used against a registration belonging to a different tenancy
- **THEN** the system responds with HTTP 404

#### Scenario: A revoked link

- **WHEN** the tenancy's link has been revoked
- **THEN** registering is refused, exactly as paying and reporting already are
