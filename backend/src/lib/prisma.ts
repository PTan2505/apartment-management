import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "@/generated/prisma/client.js";
import { env } from "@/config/env.js";

/**
 * Serialize Decimal columns as JSON numbers rather than strings.
 *
 * By default `Decimal.toJSON()` returns a string, so an invoice goes out as
 * `{"totalAmount":"3450000"}`. That breaks arithmetic, makes sorting
 * lexicographic ("9" above "10"), and throws on `toFixed` — for every caller,
 * on all thirteen Decimal columns plus the revenue report's computed figures.
 *
 * This is done here, once, rather than field by field in each service. Per-field
 * conversion has a silent failure mode: miss one and it stays a string with
 * nothing to signal it. There is no way to do it in a JSON replacer either —
 * `JSON.stringify` applies `toJSON` before the replacer runs, so a replacer only
 * ever sees an already-converted string it cannot distinguish from a real one.
 *
 * Safe for this schema because every column fits inside the range JavaScript
 * integers represent exactly:
 *
 *     Decimal(14,0)  max  99,999,999,999,999    ~1.0e14
 *     Decimal(14,2)  max     999,999,999,999.99 ~1.0e12
 *     Decimal(12,4)  max          99,999,999.9999
 *     Number.MAX_SAFE_INTEGER                    ~9.007e15
 *
 * Amounts are whole dong and every calculation happens server-side; clients
 * display and sort. Adding a column that could exceed that headroom, or moving
 * arithmetic to the client, means revisiting this.
 *
 * Null columns are unaffected — `toJSON` is only consulted on an actual Decimal,
 * so an expense with no recorded rate stays null rather than becoming zero.
 *
 * The cost of doing it here: nothing at a call site hints that it happens. A
 * service reading `Decimal` would reasonably expect a string on the wire. It
 * lives in this module because every service already imports it, so the override
 * is in effect before any query can run.
 */
// The cast is needed because `toJSON` is declared as returning a string — which
// is exactly the declaration being overridden. Nothing in this codebase calls
// `toJSON` directly; it exists for `JSON.stringify`, which accepts any return
// value. Kept as narrow as possible so it cannot mask an unrelated type error.
(Prisma.Decimal.prototype as unknown as { toJSON(): number }).toJSON =
  function toJSON(this: Prisma.Decimal): number {
    return this.toNumber();
  };

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
