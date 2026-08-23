## Why

Buildings and rooms exist, but nothing connects a person to a room. Leases are the missing link: billing needs to know who occupies which room and how many people live there, and revenue reporting ultimately rolls up from invoices that only exist because a lease does. This change also settles the debt `api-property-room` deliberately deferred — the "cannot retire an occupied building or room" guards, which were unenforceable until leases existed.

## What Changes

- Add a `Lease` model recording a room, a start date, an agreed duration in months, an occupant count for billing, and an actual move-out date.
- Add a `LeaseOccupant` model listing the individual people living under a lease, so an owner keeps a record of who is in each room and can track someone moving between rooms mid-lease.
- Add customer management: an owner can register a person, stored as a `User` with the `customer` role and no password (customer login remains out of scope). Registering someone whose phone number already exists returns that existing record rather than creating a duplicate, so a returning renter or one taking a second room reuses their identity.
- **BREAKING (schema)**: `User.phone` becomes optional. Occupants such as children may have no phone, but still need a stable identity so the system can follow one person between rooms. Owner login is unaffected — owners always have a phone.
- Being "the tenant" is recorded per lease, not per person: the `LeaseOccupant` row for the lease signatory is marked primary. The same person can be the signatory on one lease and an ordinary occupant on another, and a lease's signatory can change without losing the record of who held it before.
- Enforce that a room has at most one active lease, that a lease has at most one active primary occupant, and that a person is not listed twice as an active occupant of the same lease.
- Derive rather than store values that would otherwise duplicate a source of truth:
  - **Expected end date** comes from start date plus duration.
  - **Lease status** (active vs finalized) comes from whether a move-out date is recorded.
  - **Occupant status** (still living there vs moved out) comes from whether a departure date is recorded, so the system knows *when* someone left rather than only *that* they left.
  - **The lease's tenant** is the current primary occupant.
- **`Lease.occupantCount` stays a manually maintained number and is the authoritative input for billing.** It is deliberately *not* derived from `LeaseOccupant` rows: an owner may know five people live in a room while holding details for only two. The two figures may legitimately disagree, and reconciling them automatically would silently change what tenants are charged.
- **MODIFIED**: retiring a building or a room is now rejected when an active lease would be orphaned. This tightens two existing requirements that previously allowed unconditional retirement.
- Contract document upload is **not** included. Storing a lease's signed agreement in S3 is a separate concern with its own external dependency (bucket, credentials, presigned upload flow) and is scoped to a follow-up `api-lease-contracts` change. A lease is valid without a contract file attached.

## Capabilities

### New Capabilities
- `lease`: Creating and tracking rental agreements that bind people to a room for a period — including the occupants living under each lease, move-out, and the one-active-lease-per-room rule.
- `customer`: Registering and retrieving the people who rent or occupy rooms, stored as `customer`-role users.

### Modified Capabilities
- `building`: "Owner can retire and restore a building" — retirement is now rejected while any room in the building has an active lease.
- `room`: "Owner can retire and restore a room" — retirement is now rejected while the room has an active lease.

## Impact

- **Code**: new `backend/src/modules/leases/` and `backend/src/modules/customers/` (router, controller, service, schema each); changes to the buildings and rooms services to enforce the new retire guards.
- **Database**: adds `Lease` and `LeaseOccupant` tables with partial unique indexes enforcing one active lease per room, one active primary occupant per lease, and no duplicate active occupant. Alters `User.phone` to be nullable.
- **API surface**: adds routes under `/customers` and `/leases`, including nested occupant routes, all requiring an authenticated `owner`.
- **Behavioral change**: retiring an occupied building or room now fails where it previously succeeded. No production data exists yet, so nothing needs migrating.
- **Dependencies**: none beyond what is already installed.
- **Out of scope**: no S3 or contract files, no invoices or billing math, no customer-facing login — each belongs to a later change.
