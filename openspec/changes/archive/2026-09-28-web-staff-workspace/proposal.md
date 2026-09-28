## Why

Once the API narrows what staff can see, the application has to match it. A
manager signing in today would be shown the whole navigation, including a
revenue report that will refuse them, and lists that come back narrowed with
nothing saying why.

A maintenance worker has it worse: every screen in the application is one they
are refused.

## What Changes

- The application opens on the screen a role is for: buildings for the owner,
  tenancies for a manager, damage reports for maintenance.
- Managers see the screens they can act on, without the revenue report and
  without the staff screen; their lists say which buildings they cover.
- Maintenance sees one screen: the damage reports of its buildings, with the
  room, the tenant and how to reach them, and the two things it does — record
  the appointment, close it when done.
- A manager sees the same report screen for their buildings, because the owner
  said either of them may be the one who calls the tenant.

## Impact

- Affected specs: `web-staff`, `web-infrastructure`
- Affected code: navigation and routing, a new
  `frontend/src/features/damage-reports/*`
