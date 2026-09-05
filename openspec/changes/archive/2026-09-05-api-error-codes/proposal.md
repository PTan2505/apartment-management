## Why

Every error the API returns already carries a code. The problem is what the code
says: there are 183 places that throw, phrased as 96 distinct messages, and they
share **five** codes between them.

`VALIDATION_ERROR` alone covers 95 of those throws, including

- `Cannot add a room to a retired building`
- `A fee cannot begin applying before its lease starts`
- `Departure date cannot precede the date they joined`

which have nothing to do with one another. A code that cannot tell them apart
cannot be used to say anything specific about them, so today the only thing
carrying the meaning is the message — and the message is in English. The owner
who mistypes a password reads `Invalid phone number or password` on the first
screen of the application.

The frontend already parses the code, types it, and branches on it in exactly
one place. What it cannot do is phrase the error, because there is nothing
specific enough to phrase.

## What Changes

- **Every throw site gets a code that names its situation**, not its category:
  `ROOM_BUILDING_RETIRED`, `FEE_STARTS_BEFORE_LEASE`, `LEASE_MOVE_OUT_BEFORE_JOIN`.
  Roughly 96 of them, one per distinct message that exists today.
- **`code` becomes the specific one.** The category it replaces is not lost: an
  authorization failure, a missing resource, a conflict and a validation failure
  are exactly what the HTTP status already distinguishes, and screens that need
  the category read `status`.
- **The frontend phrases errors in Vietnamese from the code**, in one dictionary.
- **The dictionary is exhaustive by construction.** The code union is generated
  from the backend into the frontend, and the dictionary is typed against it, so
  a backend error added without a Vietnamese phrase **fails to compile**. CI
  checks the generated file is current, so it cannot drift silently either.
- **An unknown code still reads as Vietnamese.** A backend deployed ahead of the
  frontend can emit a code the dictionary has never seen; that falls back to a
  sentence chosen by HTTP status, never to English and never to the raw code.

### What this costs, stated plainly

96 situations have to be named, and 96 Vietnamese sentences written. The
alternative considered — the backend writing the sentence — was put to the owner
and declined, and the reason to decline it is real: the owner's application and
the tenant portal have different readers, and a shared backend sentence forces
one wording on both.

The risk that came with the choice is that a new error reaches a screen with no
phrase for it. The compile-time exhaustiveness above is what makes that
impossible during development, and the status fallback is what makes it harmless
in the one case exhaustiveness cannot cover — a deploy where the two sides are
different versions.

## Capabilities

### Modified Capabilities

- `api-infrastructure`: the standardized error shape gains what its code must
  IDENTIFY. Today the requirement asks only for "a machine-readable error code or
  type", which the current five satisfy while being useless to a caller that
  wants to say something specific.
- `web-infrastructure`: the application presents errors from the API in
  Vietnamese, which the requirement that everything is in Vietnamese currently
  and deliberately exempts them from.

## Impact

- `backend/src/lib/errors.ts` — errors carry a situation code rather than
  deriving one from their class.
- Every `backend/src/modules/*/service.ts` — 183 throw sites named.
- A generator producing the code union for the frontend, and a CI step checking
  it is current.
- `frontend/src/lib/api-error.ts` — the union comes from the generated file.
- A new dictionary in the frontend, and `frontend/src/features/addresses/hooks.ts`,
  the one place branching on a code today.
- **No change to the error envelope's shape.** Same four fields, same statuses.
  Only the value of `code` becomes more specific.
