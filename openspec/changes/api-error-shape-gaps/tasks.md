# Tasks

## 1. Body parser failures answer in the standard shape

- [x] 1.1 Add error types for a body that could not be read, one too large, and one in an unreadable encoding. The first must carry a code of its own, distinct from the one validation failures use.
- [x] 1.2 Translate the parser's failures into those types inside the single error handler, so nothing else gains the ability to write an error body.
- [x] 1.3 Discriminate on the parser's own `type` field, never on the message text.
- [x] 1.4 Leave anything unrecognised falling through to 500. Not knowing whose fault it is means reporting it as ours.

## 2. A failure before routing is visible

- [x] 2.1 Register the request logger ahead of the body parser, so a rejected body is logged like any other request.
- [x] 2.2 Answer an address matching no route with the standard shape rather than HTML, by throwing rather than responding directly — registered after all routes and before the error handler, because it works in neither of the other two positions.

## 3. Verification

Every one of these is about a request that never reaches a route handler, so each has to be sent, not reasoned about. Run them against a running server.

- [x] 3.1 A body that is not valid JSON answers 400 in the standard shape, with the code that means the body could not be read.
- [x] 3.2 That code differs from the one returned for a body that parsed and failed validation — compared as returned, not as intended.
- [x] 3.3 A body past the size limit answers 413 in the standard shape.
- [x] 3.4 A body in an unreadable encoding answers 415 in the standard shape.
- [x] 3.5 An address matching no route answers 404 as JSON, and the body parses as JSON.
- [x] 3.6 **Each of the above appears in the request log.** This is the half of the defect that a corrected status hides: check the log, not only the response.
- [x] 3.7 **Nothing already correct changed**: a valid body with a bad field still answers 400 with its details, bad credentials still answer 401, a missing token still answers 401, and a well-formed request to a real address still succeeds.
- [x] 3.8 `tsc --noEmit` passes.
