import { pinoHttp } from "pino-http";
import { env } from "@/config/env.js";

export const requestLogger = pinoHttp({
  level: env.NODE_ENV === "production" ? "info" : "debug",

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
