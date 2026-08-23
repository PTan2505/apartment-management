## Why

The API promises one error shape for every failed request. Two kinds of failure escape it, and both were found by accident rather than by test.

A request body that cannot be parsed is answered `500 INTERNAL_SERVER_ERROR` — the server confessing to a fault that was the caller's, and telling them to retry something that will fail identically forever. It is also answered *silently*: the body parser is registered before the request logger, so `req.log` does not exist yet and the error handler's log call does nothing. A 500 that appears in no log is a defect that cannot be noticed.

An address matching no route is answered with Express's stock HTML page. Any client that parses the error body — every client we have — gets a syntax error instead of a message.

Neither is a case of the code disagreeing with the spec. The spec's only scenario about bad input says "a route handler rejects a request due to validation failure", and neither of these ever reaches a route handler. The requirement says *every* failed request, but nothing tests the gap between "every" and the one scenario written under it. That gap is what this change closes.

Found while verifying the tenant portal against production: a malformed body sent by mistake came back as a 500, on a deployment where nothing was wrong.

## What Changes

- Body parser failures are translated into the standard error shape with an accurate status: malformed JSON → `400 MALFORMED_BODY`, an oversized body → `413 PAYLOAD_TOO_LARGE`, an unreadable encoding → `415 UNSUPPORTED_MEDIA_TYPE`, an incomplete body → `400 MALFORMED_BODY`.
- A new `MALFORMED_BODY` code, deliberately distinct from `VALIDATION_ERROR`. The latter always names the fields that failed; a body that was never parsed has no fields to name, and a caller receiving `VALIDATION_ERROR` with no `details` cannot tell whether its JSON is broken or a value is wrong. The two need different fixes.
- The request logger moves ahead of the body parser, so a rejected body is logged like any other request. Without this the status is corrected but the silence is not.
- An address matching no route answers `404 NOT_FOUND` in the standard shape rather than HTML.
- The requirement gains scenarios for failures that occur before routing, so "every failed request" is tested rather than asserted.

No breaking change: every status that was already correct is unchanged, and the three corrected statuses replace a 500 that no caller could have been relying on.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `api-infrastructure`: the standardized error response requirement gains explicit obligations for failures raised before a route is reached — an unparseable, oversized or incomplete body, and an address matching no route — and for those failures being logged.

## Impact

- `backend/src/lib/errors.ts` — three error classes added.
- `backend/src/middleware/error-handler.ts` — translates body parser failures; still the single place producing error JSON.
- `backend/src/server.ts` — logger registered before the body parser; a terminal not-found handler added after the routes.
- No database, dependency, or configuration change. No frontend change: the portal and owner applications already read the standard shape, and now receive it in two more cases.
