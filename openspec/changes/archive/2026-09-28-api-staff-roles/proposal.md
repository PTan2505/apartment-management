## Why

Every endpoint in the system is `requireRole("owner")`. One person signs in, and
everything the business does goes through them — including the two jobs that are
not theirs: running a building day to day, and fixing what breaks in it.

The owner wants to hand those out without handing over the books. A manager runs
a building and must not see what the business earns. A maintenance worker sees
what needs fixing in the buildings they cover and nothing else.

## What Changes

- Two roles: `manager` and `maintenance`. `owner` and `customer` are unchanged.
- Staff are assigned to buildings, many to many, and see only the buildings they
  are assigned to.
- A manager may run their buildings: sign, renew and close tenancies, record
  payments, run the month's billing, record expenses. They may NOT see the
  revenue report, change a building or its rates, or manage staff.
- Maintenance sees damage reports for its buildings and nothing else.
- The owner creates staff accounts with a phone number; the system generates the
  first password and shows it ONCE.
- A staff account must change that password before it can do anything else. The
  API refuses every other request until it has.

## Impact

- Affected specs: `auth`, `staff` (new)
- Affected code: `backend/prisma/schema.prisma` (+ migration),
  `backend/src/middleware/require-role.ts`, a new building-scope middleware,
  `backend/src/modules/auth/*`, a new `backend/src/modules/staff/*`, and the
  `where` clause of every listing that belongs to a building
