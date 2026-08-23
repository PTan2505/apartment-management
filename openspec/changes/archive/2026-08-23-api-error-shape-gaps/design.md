## Context

See proposal.md — Why. What matters for the approach: the failures in question happen in middleware the project did not write, before any of its own code runs, and two of them are sensitive to the order middleware is registered in. See `specs/api-infrastructure/spec.md` for the obligations.

## Goals / Non-Goals

**Goals:**

- Keep one place responsible for producing error JSON. The project's rule is that a controller never hand-rolls an error body; a fix that scatters error responses into middleware would break that for the sake of four cases.
- Make the corrected status *and* the log line arrive together. Either alone leaves the defect half-fixed.

**Non-Goals:**

- Changing the body size limit, or making it configurable. The limit is not what was wrong; the answer given when it is exceeded was.
- Reworking how validation failures are reported. They were already correct.
- Auditing other middleware for failures that bypass the error shape. If more exist, they are a separate finding — this change closes the two that were observed.

## Decisions

**Translate parser failures into `AppError`, rather than catching them where they are thrown.**

The alternative is a dedicated error-handling middleware sitting directly after the body parser, which would respond itself. That puts a second producer of error JSON in the stack, and the two would drift — the shape is currently guaranteed by there being exactly one place that writes it. Translating instead means the recognised failure rejoins the existing path and is serialised by the same code as everything else.

**Discriminate on the parser's `type` field, not the message.**

`type` is body-parser's documented, stable discriminator; the message text is prose and changes between versions. Matching on prose is a fix that breaks on an upgrade with no test failing.

**Anything unrecognised keeps falling through to 500.**

A tempting generalisation is to honour any error carrying a 4xx `status` property. It would catch more, and it would also silently reclassify a future dependency's internal error as the caller's fault. An unrecognised failure being reported as a server fault is the correct default: it is the case where we do not know whose fault it is.

**A code of its own for an unparseable body, not `VALIDATION_ERROR`.**

Every `VALIDATION_ERROR` in this API carries `details` naming the inputs that failed. A body that was never parsed has no inputs, so it would be the one `VALIDATION_ERROR` without them — indistinguishable, to a caller, from a validation failure whose details went missing. The two call for different fixes on the caller's side, so they get different codes.

**The request logger moves ahead of the body parser.**

`req.log` is installed by the logger, and the error handler logs through it. Registered after the parser, a rejected body reached the error handler with no `req.log`, and the optional call did nothing — which is why a 500 sat in production unobserved. Moving the logger first also means the request log becomes a complete record of requests received, rather than of requests that got as far as having a readable body.

The cost is that the logger now sees requests it previously did not, including malformed ones. That is the point.

**The not-found handler goes after all routes and before the error handler.**

Order is load-bearing in both directions. Before the routes, it would answer everything. After the error handler, it would never run, because the error handler is terminal. It throws a `NotFoundError` rather than responding directly, for the same reason as above: one producer of error JSON.

## Risks / Trade-offs

**A client currently treating a 500 on a malformed body as retryable will now get a 400 and stop retrying** → That is the intended correction. The retry could never have succeeded; the request was malformed and would be malformed again.

**Moving the logger changes what appears in logs, on a deployment with a limited free-tier log budget** → The increase is bounded by the number of malformed requests, which should be near zero. If it is not, that is a signal worth having rather than noise worth suppressing.

**A terminal not-found handler can mask a routing mistake by answering neatly** → It already answered; the change is only its shape. A route registered wrongly produced a 404 before this change too.

## Migration Plan

Deploy as an ordinary change: no schema, no configuration, no data. Rollback is reverting the commit — nothing persists that a previous version could not read.

The three corrected statuses are the only externally visible difference, and each replaces a 500 that no client could sensibly have depended on.
