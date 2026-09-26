## Why

The API will let an owner create staff and assign them buildings. Without a
screen that is a feature nobody can use — the same gap the portal link had until
last week.

And the password it generates appears exactly once. A screen is the only place
that can put it in front of the owner at that moment, with a way to copy it.

## What Changes

- A screen for the owner: the staff there are, what role each holds, which
  buildings they cover, and whether they can still sign in.
- Creating an account shows the generated password once, ready to copy, and says
  plainly that it cannot be shown again.
- Assigning and unassigning buildings, resetting a password, deactivating and
  restoring an account.
- A change-password screen the application sends staff to on first sign-in, and
  which anybody signed in can reach to change their own.

## Impact

- Affected specs: `web-staff` (new), `web-auth`
- Affected code: a new `frontend/src/features/staff/*`, the navigation, and the
  sign-in flow
