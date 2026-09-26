## 1. The connection

- [x] 1.1 A WebSocket endpoint on the existing server, authenticated by a first message
- [x] 1.2 A connection with no token, a bad token, or a token in the URL is closed
- [x] 1.3 An expiring token can be replaced on the same connection; an expired one closes it
- [x] 1.4 A registry of connections by account, with a startup line naming the instance

## 2. The event

- [x] 2.1 Raising a report sends an event to that building's staff and the owner, after commit
- [x] 2.2 Staff of other buildings receive nothing
- [x] 2.3 The event carries an id, a room and a time — nothing the recipient could not already read

## 3. The notices

- [x] 3.1 A notice per recipient, written in the same transaction as the report
- [x] 3.2 An unread count, and a list newest first
- [x] 3.3 Reading marks that account's own notices, nobody else's
- [x] 3.4 A notice stays after its report is closed, and says it was dealt with

## 4. The screen

- [x] 4.1 The shell shows the count and raises it live
- [x] 4.2 A brief notice on arrival, naming the room, opening the report screen
- [x] 4.3 The notice list; reading it clears the count — opening the report waits for the report screen (web-staff-workspace)
- [x] 4.4 `react-use-websocket`: one shared connection, auth on open, reconnect with backoff
- [x] 4.5 With no connection: the count is still correct on arrival and refreshed periodically

## 5. Strings

- [x] 5.1 New Vietnamese strings reported for review

## 6. Checks

- [x] 6.1 `tsc --noEmit` both sides, lint, builds
- [x] 6.2 Two browser windows side by side: a tenant raises a report in one, a manager's count rises in the other without a reload
- [x] 6.2b The report is then closed, and the notice is still listed, marked dealt with
- [x] 6.3 The same with the connection blocked — the count is still right after navigating
- [x] 6.4 A manager of another building sees nothing, checked in the same pair of windows
