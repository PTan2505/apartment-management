## Why

The damage-report change says plainly that staff find out about a new report by
opening the screen. That is honest and it is not good enough: a leak reported at
nine in the morning waits until somebody happens to look.

Zalo would solve it and costs a business registration, a template approval and a
token that expires hourly. Inside the application it costs a socket.

## What Changes

- The API pushes an event when a report is raised, to the staff of that
  building and to the owner, over a WebSocket authorised by the same access
  token the rest of the API uses.
- The application shows how many reports are waiting, and says so the moment one
  arrives rather than at the next reload.
- What is unread is DERIVED — open reports raised since that person last looked
  at the report screen — so a notice survives a closed laptop, a dropped
  connection and a server restart. The socket makes it immediate; it is not what
  makes it true.
- One change rather than an API half and a web half: a socket contract is a
  single agreement, and either half alone cannot be exercised.

## Impact

- Affected specs: `api-infrastructure`, `damage-report`, `web-staff`
- Affected code: `backend/src/server.ts` (the HTTP server gains an upgrade
  handler), a new `backend/src/lib/live.ts`, the damage-report module, and the
  shell and report screens on the frontend
