import { ForbiddenError } from "@/lib/errors.js";

/**
 * The money terms of a tenancy, which only the owner states.
 *
 * A manager signs tenancies; what one COSTS is the business deciding what it
 * sells. Each of these four is taken from the room and its building, and a
 * manager who supplies one is refused rather than quietly overruled.
 *
 * Refused, not stripped. Dropping the field would be one line and would create
 * the tenancy at the room's rent while the manager believes it carries theirs —
 * the tenant is then billed an amount nobody agreed, and nothing anywhere
 * records that a different figure was asked for. A refusal costs one round trip
 * and cannot mislead.
 *
 * Checked against the RAW body, before parsing: once a schema has applied its
 * defaults, "supplied and equal to the default" and "omitted" are the same
 * value, and only one of them is a manager overstepping.
 */
const MONEY_TERMS = {
  baseRent: "tiền thuê",
  electricityRate: "giá điện",
  waterRatePerPerson: "giá nước",
  depositMonths: "số tháng cọc",
} as const;

export type MoneyTerm = keyof typeof MONEY_TERMS;

/** The terms settled when a tenancy is signed. */
export const SIGNING_TERMS: readonly MoneyTerm[] = [
  "baseRent",
  "electricityRate",
  "waterRatePerPerson",
  "depositMonths",
];

/**
 * The terms settled when one is renewed.
 *
 * A renewal takes the rest from its predecessor, so only these two can be
 * named — and they must be refused for the same reason the others are. Without
 * this the rule above is a formality: sign at the owner's rent, renew at your
 * own the same afternoon.
 */
export const RENEWAL_TERMS: readonly MoneyTerm[] = ["baseRent", "depositMonths"];

/**
 * Refuses a caller who is not the owner and has named a price.
 *
 * Silent for the owner, for whom every one of these is theirs to set, and for a
 * request that named none — which is the ordinary case for a manager and must
 * cost nothing.
 *
 * A request with no user on it fails the owner test and is therefore refused
 * the moment it names a term. That is the safe direction, and it cannot happen
 * anyway: every route reaching here is behind `authenticate`.
 */
export function assertTermsAreTheirs(
  req: { user?: { role: string }; body?: unknown },
  terms: readonly MoneyTerm[],
): void {
  if (req.user?.role === "owner") return;

  const body = req.body;
  if (typeof body !== "object" || body === null) return;

  const named = terms.filter((term) => (body as Record<string, unknown>)[term] !== undefined);
  if (named.length === 0) return;

  throw new ForbiddenError(
    "LEASE_TERMS_OWNER_ONLY",
    `Only the owner sets ${named.join(", ")} on a tenancy; each is taken from the room and its building`,
    // Named so the screen can point at the fields rather than at the form, and
    // so a refusal read in a log says which figure was attempted.
    { terms: named, labels: named.map((term) => MONEY_TERMS[term]) },
  );
}
