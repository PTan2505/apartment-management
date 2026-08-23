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
