## Context

The application has one role today. The navigation is a fixed list, the router
guards only "signed in or not", and the sign-in flow goes straight to the
buildings screen.

## Goals / Non-Goals

- Goal: an owner can hand somebody an account and a password in one sitting.
- Goal: a staff member cannot get anywhere without replacing that password.
- Non-Goal: self-service password recovery. There is no email in this system and
  no channel to send anything through; the owner resets it.

## Decisions

### The password is held in component state, never in a query cache

It arrives in the response that creates the account and is shown from there.
Putting it in the query cache would keep it for the session and survive a
navigation, which is exactly the "shown again" the API refuses to do.

### The guard is a route wrapper, mirroring the API

`ProtectedRoute` gains a role check, and a second wrapper sends an account owing
a password change to that screen. Both mirror server-side rules rather than
replacing them — the API refuses anyway, and the screen exists so the person is
told something useful instead of being refused.

### Navigation is filtered by role, not merely guarded

A link to a screen that will refuse you is a bug report waiting to be written.
The destinations list gains the roles each entry is for.

## Risks / Trade-offs

- **A copied password lives in a clipboard.** Accepted: the alternative is
  reading it aloud, which is the situation this replaces, and it is replaced at
  first sign-in anyway.
