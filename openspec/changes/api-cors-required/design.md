## Context

See proposal.md — Why.

Two places hold this behaviour. `env.ts` parses `WEB_ORIGINS` into a possibly-empty array and already carries two cross-field refinements that refuse impossible configurations at startup. `server.ts` turns that array into `cors()` options, today branching on whether it is empty.

## Goals / Non-Goals

Making the unconfigured case either refuse (production) or actually work (elsewhere). Not: changing what a configured deployment does, and not touching `CROSS_SITE_COOKIES`, which is a separate setting with its own rule.

## Decisions

### Refuse in `env.ts`, not in `server.ts`

The refusal belongs with the other two refusals, in the schema that already fails the process at startup with a message naming the setting. Putting it in `server.ts` would mean the process starts, binds a port, and then decides it cannot serve — and the two impossible-configuration checks that already exist would live somewhere different from the third.

### Outside production, reflect the requesting origin rather than sending a wildcard

`cors({ origin: true, credentials: true })` echoes the request's `Origin` and allows credentials, which is what a browser will accept. The wildcard cannot carry credentials at all, so keeping it would leave the local case broken in exactly the way that prompted this change.

Reflecting any origin with credentials is a real permission and would be wrong in production — which is precisely why it is refused there. Confined to development it costs nothing: the API is on a laptop, reachable from that laptop.

The alternative considered was defaulting to a list of localhost ports. It fails the moment somebody uses a different port, and produces the same silent CORS failure this change exists to remove, only rarer and therefore harder to diagnose.

### The message has to say why, not only what

"WEB_ORIGINS is required" sends a reader to set it to something, and the plausible something is a wildcard, which is where they came in. The message names the setting, says production requires it, and says what breaks without it — a front end that cannot sign in.

### `.env.example` stops shipping the empty value as if it worked

The file is now public and is the documented starting point. It gets the same treatment the other grouped settings have: a comment saying what it is for and that a deployment needs it, with a real-shaped example rather than an empty assignment that reads as optional.

## Risks / Trade-offs

- **A production deployment with no `WEB_ORIGINS` stops booting.** That is the point, and it is a behaviour change to be stated rather than smuggled. The existing production deployment sets it — checked before proposing — so nothing in flight breaks. → Called out as BREAKING in the proposal, and the startup message says exactly what to set.
- **Reflecting any origin in development is permissive.** → It is refused in production by the same change, which is the only place the permission would matter. And it is not new ground: the previous behaviour permitted any origin too, just without credentials, which made it useless rather than safe.
- **`NODE_ENV` now decides more than it did.** A deployment that forgets to set it to `production` gets development's permissiveness. → Already true of `CROSS_SITE_COOKIES` and of cookie `Secure`; this change adds a third reason to get it right rather than a new failure mode.

## Migration Plan

Set `WEB_ORIGINS` on any production deployment before this ships — the current one already has it. No data change, no migration. Reverting is reverting the commit.

## Open Questions

None.
