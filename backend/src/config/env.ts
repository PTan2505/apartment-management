import "dotenv/config";
import { z } from "zod";

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
