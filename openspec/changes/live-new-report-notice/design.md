## Context

The API is a single Express process, deployed on Render, behind a browser
application on another origin. Access tokens are JWTs living fifteen minutes,
renewed through a refresh cookie scoped to `/auth`.

## Goals / Non-Goals

- Goal: staff learn about a report within seconds of it being raised.
- Goal: the same fact is available without the socket, so nothing depends on a
  connection that a hotel wifi can refuse.
- Non-Goal: a general notification system — a table of notices, types, read
  state, digests. One event exists; inventing a framework around it would be
  building for a second case nobody has asked for.
- Non-Goal: delivering to people who are not connected. That is what Zalo or
  email would be for, and both were deliberately deferred.

## Decisions

### `ws` on the server, `react-use-websocket` in the browser

One upgrade handler on the existing HTTP server, so Render needs nothing
configured and CORS stays the one list of origins the API already keeps.

NOT Socket.IO: it brings its own protocol, a required client library and a
long-polling fallback for a case this does not have — and the fallback this
change actually needs is different in kind, being that the count is correct
without any connection at all.

`react-use-websocket` on the frontend is a different decision and a compatible
one: it is a hook around the browser's own WebSocket, not a protocol, so it
talks to a plain `ws` server unchanged. It supplies what would otherwise be
written by hand — reconnection with backoff, one shared connection across
components, a heartbeat, JSON helpers and a readyState to render from — and the
first message after `onOpen` is where the access token goes.

### Authentication is a first message, never the URL

The browser's WebSocket API cannot set headers, which leaves the query string or
a message. The query string is written into the access log on every connection,
which is exactly what the portal token spec refuses to do with a credential.

So: connect, send `{type: "auth", token}` within five seconds or be closed. The
server holds the token's expiry and closes the connection when it passes unless
a newer token has arrived — the client sends one each time it renews.

### A notice is a row per recipient, and it outlives the report

`ReportNotice(userId, reportId, createdAt, readAt)`, written for everyone
covering the building at the moment the report arrives.

The owner chose this over deriving "what is still waiting" from the reports
themselves, and it buys the simpler meaning: a notice records that something
HAPPENED, so it stays after the report is scheduled and after it is closed. The
derived version answers a different question — what is left to do — which the
report screen already answers, oldest open first.

The consequences are accepted rather than worked around:

- Somebody assigned to a building later gets no notices for what came before.
  Those reports are on the report screen; the notice list is not a work queue.
- A notice read by one manager stays unread for another, because it is their
  own row.
- Recipients are a snapshot. Unassigning somebody does not withdraw notices they
  already received, which is correct: they did receive them.

### The event and the row are written together

The notices are written in the same transaction as the report, and the socket
event is sent after it commits. A notice nobody was pushed still appears on the
next visit; a push with no row behind it would vanish on reload.

### One process, and a guard for the day there are two

The registry of connections is a map in memory, which is correct for one
process and silently wrong for two: half the staff would miss half the events.

This is stated rather than defended: if the API is ever scaled beyond one
instance, events must go through a shared channel (Redis pub/sub or Postgres
`LISTEN/NOTIFY`) before that happens. The tasks include a startup log line
naming the instance, so the day it is scaled there is something to notice.

### Events carry an id, not the record

The client refetches. A pushed record is a second serialisation of something an
endpoint already returns, free to drift from it and to leak a field the
recipient's role would not have been given.

## Risks / Trade-offs

- **Best-effort delivery.** Accepted by design: the count on arrival is the
  correct one, and the socket only makes it sooner.
- **A socket per signed-in staff member.** A handful of people; nothing to
  manage.
- **Render idles a free service.** A sleeping service holds no connections; the
  client reconnects with backoff and the count is correct on the next request
  either way.
