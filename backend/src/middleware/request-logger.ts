import { pinoHttp } from "pino-http";
import { env } from "@/config/env.js";

export const requestLogger = pinoHttp({
  level: env.NODE_ENV === "production" ? "info" : "debug",

  /**
   * The host's own health check is not traffic, and logging it drowns out the
   * traffic that is.
   *
   * Render probes every five seconds, forever. In production that is around
   * seventeen thousand identical lines a day, and a live log in which nothing
   * else is visible is a live log nobody reads.
   *
   * Matched on the header Render sends rather than on the path, so a real
   * request to `/health` — somebody checking after a deploy — is still logged.
   */
  autoLogging: {
    ignore: (req) => req.headers["render-health-check"] === "1",
  },

  /**
   * Credentials must not reach the log.
   *
   * `pino-http` logs request and response headers by default, which put every
   * owner's access token, every refresh token cookie, and — once the portal
   * existed — every tenant's portal link into the log file on each request. A
   * log is rotated, shipped elsewhere, and read by anyone debugging; it is
   * ordinarily less protected than the database these values are deliberately
   * hashed inside.
   *
   * Found by the tenant portal's own verification, which asserted its token was
   * nowhere in the log and discovered that it was — along with credentials that
   * had been leaking there since the project began.
   *
   * Keeping the portal token out of the URL was the other half of this and is
   * not redundant with it: a fragment never leaves the browser at all, so it
   * stays out of browser history and out of any proxy in between. Redaction
   * only covers this server's own log.
   */
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      'res.headers["set-cookie"]',
    ],
    censor: "[redacted]",
  },
});
