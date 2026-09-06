import "dotenv/config";
import { z } from "zod";

/**
 * `.env.example` ships optional keys blank, so copying it — the documented
 * setup — would otherwise supply an empty string where "unset" was meant.
 * "Optional" has to mean optional along the path people actually take.
 */
const blankAsAbsent = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),

  /**
   * OpenMap.vn API key, for resolving a picked address into ward and city.
   *
   * Deliberately optional rather than required: making it required would mean
   * nobody can start the backend without first registering with OpenMap, which
   * is a poor trade for a feature that only affects one form. The address
   * lookup endpoints report that lookup is unconfigured when it is absent;
   * everything else runs normally.
   */
  //
  // An empty value counts as absent. `.env.example` ships this key blank, so
  // copying it to `.env` — the documented setup — would otherwise supply an
  // empty string, fail `min(1)`, and stop the server from starting at all.
  // "Optional" has to mean optional along the path people actually take.
  OPENMAP_API_KEY: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(1).optional(),
  ),

  /**
   * payOS credentials, for taking payment online.
   *
   * Optional as a GROUP, on the same reasoning as OPENMAP_API_KEY: an owner who
   * does not take payments online must not be unable to start the backend.
   * Absent, the tenant portal shows bills and offers no way to pay them.
   *
   * But partial configuration is refused, which is where this differs. A client
   * id without a checksum key produces a system that CREATES payment links and
   * cannot verify the confirmations they generate — it would look like it was
   * working, take a tenant's money, and have no way to record it. That is worse
   * than not being configured at all, so it is not allowed to start.
   */
  PAYOS_CLIENT_ID: blankAsAbsent,
  PAYOS_API_KEY: blankAsAbsent,
  PAYOS_CHECKSUM_KEY: blankAsAbsent,

  /**
   * The browser origins allowed to call this API, comma-separated.
   *
   * Both surfaces need naming: the owner's application and the tenant portal
   * are deployed separately and both call here.
   *
   * REQUIRED IN PRODUCTION, and refused at startup without it — see the
   * refinement below.
   *
   * It used to be optional, documented as "empty means any origin". That
   * described a permission which permits nothing. A browser will not send
   * credentials to a wildcard origin, and every real client of this API signs
   * in, so an unconfigured deployment does not get a permissive API: it gets
   * one whose frontend cannot sign in, and it finds out at a user's first
   * attempt.
   *
   * Local development never noticed because it does not use CORS at all — the
   * dev server proxies `/api`, so the browser is making same-origin requests.
   * The fallback was therefore never exercised by anything that worked while
   * being described as the thing local development depended on.
   *
   * Outside production it stays optional, and the requesting origin is
   * reflected WITH credentials rather than answered with a wildcard, so a
   * locally built bundle behaves the way the deployed one will.
   */
  WEB_ORIGINS: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() !== ""
        ? value.split(",").map((origin) => origin.trim()).filter(Boolean)
        : [],
    z.array(z.string().url("each origin must be a URL, e.g. https://app.example.com")),
  ),

  /**
   * Whether the refresh cookie must survive a cross-SITE request.
   *
   * True when the application and this API are on different sites — a frontend
   * on Vercel and this on Render, say. A browser will not attach a
   * `SameSite=Strict` cookie to such a request, so `POST /auth/refresh` arrives
   * without it and the session cannot be renewed.
   *
   * Stated rather than inferred. The API could compare WEB_ORIGINS against its
   * own origin, except that behind a proxy it does not reliably know its own —
   * and a wrong guess produces a login that works once and then silently stops.
   *
   * Defaults to false, which keeps `SameSite=Strict`: the safer value, and the
   * correct one when everything is served from one host.
   */
  CROSS_SITE_COOKIES: z.preprocess(
    (value) => value === "true" || value === true,
    z.boolean(),
  ),

  /**
   * Cloudflare R2, for keeping signed contracts.
   *
   * Optional as a GROUP, on the same reasoning as the payment gateway: an owner
   * who does not want to keep scans must still be able to start the system. A
   * partially configured group is refused below — a bucket with no credentials
   * fails at the moment somebody tries to use it, which is the worst time.
   *
   * R2 rather than AWS S3, chosen for v1 and deliberately the ONLY option: it
   * charges nothing for egress, which for scanned contracts is the whole of the
   * recurring cost, and supporting both would mean two configurations to
   * explain and two to get wrong.
   *
   * There is no region setting and no endpoint URL to assemble — R2 signs
   * against `auto`, and its address follows from the account id.
   */
  R2_ACCOUNT_ID: blankAsAbsent,
  R2_BUCKET: blankAsAbsent,
  R2_ACCESS_KEY_ID: blankAsAbsent,
  R2_SECRET_ACCESS_KEY: blankAsAbsent,
})
  .superRefine((value, ctx) => {
    const keys = ["R2_ACCOUNT_ID", "R2_BUCKET", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"] as const;
    const missing = keys.filter((key) => value[key] === undefined);

    if (missing.length !== 0 && missing.length !== keys.length) {
      ctx.addIssue({
        code: "custom",
        path: ["R2"],
        message:
          `Contract storage is partially configured. Set all of ${keys.join(", ")} or none of them — ` +
          `missing: ${missing.join(", ")}`,
      });
    }
  })
  .superRefine((value, ctx) => {
    // A production API with no origins named cannot be reached by any browser
    // that signs in, because signing in sends credentials and a browser refuses
    // to send those to a wildcard origin. Failing here puts the discovery in
    // front of whoever is deploying, instead of in front of the first user.
    if (value.NODE_ENV === "production" && value.WEB_ORIGINS.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["WEB_ORIGINS"],
        message:
          "WEB_ORIGINS is required when NODE_ENV=production. Name the origins your " +
          "frontends are served from, comma-separated, e.g. " +
          "https://app.example.com,https://portal.example.com — without it the API " +
          "answers browsers with a wildcard, which they refuse to send credentials " +
          "to, so sign-in fails while everything else appears to work",
      });
    }
  })
  .superRefine((value, ctx) => {
    // A `SameSite=None` cookie that is not `Secure` is DISCARDED by browsers,
    // silently. Tolerating the combination would mean the API believes it
    // issued a session while the browser kept nothing — appearing as a login
    // that succeeds once and cannot be renewed, with no error anywhere.
    if (value.CROSS_SITE_COOKIES && value.NODE_ENV !== "production") {
      ctx.addIssue({
        code: "custom",
        path: ["CROSS_SITE_COOKIES"],
        message:
          "CROSS_SITE_COOKIES requires NODE_ENV=production, because the cookie is only " +
          "marked Secure there and browsers discard a SameSite=None cookie that is not Secure",
      });
    }
  })
  .superRefine((value, ctx) => {
    const keys = ["PAYOS_CLIENT_ID", "PAYOS_API_KEY", "PAYOS_CHECKSUM_KEY"] as const;
    const missing = keys.filter((key) => value[key] === undefined);

    if (missing.length !== 0 && missing.length !== keys.length) {
      ctx.addIssue({
        code: "custom",
        path: ["PAYOS"],
        message:
          `payOS is partially configured. Set all of ${keys.join(", ")} or none of them — ` +
          `missing: ${missing.join(", ")}`,
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    console.error(`Invalid environment configuration:\n${issues}`);
    process.exit(1);
  }

  return result.data;
}

export const env = loadEnv();
