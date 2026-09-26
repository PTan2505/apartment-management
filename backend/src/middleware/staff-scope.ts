import type { NextFunction, Request, Response } from "express";

import { prisma } from "@/lib/prisma.js";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "@/lib/errors.js";

/**
 * Which buildings the caller may see — resolved once, in one place.
 *
 * `null` means "not narrowed", which is the owner. An ARRAY means staff, and
 * an empty array is a real answer: a member of staff the owner has not yet
 * assigned anything sees nothing, which is different from seeing everything.
 *
 * The distinction is why this is not simply a list of ids. Had it been, the
 * empty case and the owner case would have looked alike at every call site,
 * and the one that reads more naturally — "no ids, so no filter" — is the one
 * that shows a new employee every building in the business.
 */
export type BuildingScope = number[] | null;

/**
 * What the account itself says, and what it may see — in one query.
 *
 * Three jobs that all need the same row, so they share the request's one
 * lookup: is this account still allowed in, does it still owe a password
 * change, and which buildings does it cover.
 *
 * Asked of the DATABASE on every request rather than read from the access
 * token. The token lives fifteen minutes, and both facts here are ones the
 * owner changes expecting them to take effect now: an employee who has left
 * must stop working when the owner says so, not a quarter of an hour later.
 * One indexed lookup is the price of that, and this system serves one owner
 * and a handful of staff.
 *
 * Mounted after `authenticate`, on the domain routers only. The `/auth` router
 * stays open to an account that owes a password change — signing in, reading
 * itself, changing that password and signing out are exactly what it must be
 * able to do.
 */
export async function accountGuard(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    throw new UnauthorizedError("AUTHENTICATION_REQUIRED", "Authentication required");
  }

  const account = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: {
      isActive: true,
      mustChangePassword: true,
      staffBuildings: { select: { buildingId: true } },
    },
  });

  if (!account) {
    throw new UnauthorizedError("ACCESS_TOKEN_INVALID", "Invalid or expired access token");
  }
  if (!account.isActive) {
    throw new ForbiddenError("ACCOUNT_DEACTIVATED", "This account can no longer be used");
  }
  if (account.mustChangePassword) {
    throw new ForbiddenError(
      "PASSWORD_CHANGE_REQUIRED",
      "This account must change its password before doing anything else",
    );
  }

  req.buildingScope =
    req.user.role === "owner" ? null : account.staffBuildings.map((row) => row.buildingId);
  next();
}

/**
 * The scope as a Prisma filter on a `buildingId` column.
 *
 * Returns `{}` for an owner — no narrowing at all — and `{ buildingId: { in:
 * [] } }` for staff assigned nothing, which matches nothing. Spelling that out
 * rather than letting an empty list fall through to `{}` is the whole point of
 * the type above.
 */
export function buildingWhere(scope: BuildingScope) {
  return scope === null ? {} : { buildingId: { in: scope } };
}

/** The same filter one relation away, for rows that reach their building through a room. */
export function roomBuildingWhere(scope: BuildingScope) {
  return scope === null ? {} : { room: { buildingId: { in: scope } } };
}

/**
 * Whether a building is inside the caller's scope.
 *
 * Callers answer a failure with NOT FOUND rather than forbidden: 403 confirms
 * the record exists, and an id that can be probed for existence is a way to
 * count another building's tenancies one request at a time.
 */
export function withinScope(scope: BuildingScope, buildingId: number): boolean {
  return scope === null || scope.includes(buildingId);
}

/**
 * Refuses a request that acts outside the caller's buildings.
 *
 * For WRITES, where "does it exist" has already been answered by the read that
 * loaded it. Reads use `withinScope` and report absence instead.
 */
export function assertWithinScope(scope: BuildingScope, buildingId: number): void {
  if (!withinScope(scope, buildingId)) {
    throw new ForbiddenError("BUILDING_NOT_ASSIGNED", "That building is not assigned to you");
  }
}

/**
 * The caller's scope, as every controller reads it.
 *
 * Defaults to "not narrowed" only because the type allows it; in practice
 * `accountGuard` has always run on these routes. Written as one helper so a
 * controller cannot accidentally read the property under a different name and
 * silently get `undefined`, which would widen the scope rather than narrow it.
 */
export function scopeOf(req: { buildingScope?: BuildingScope }): BuildingScope {
  return req.buildingScope ?? null;
}

/**
 * Guards every route that names a record by id, in one line per router.
 *
 * Mounted with `router.param`, so it runs before any handler that takes that
 * id — including the routers mounted beneath it. The alternative was a scope
 * argument threaded through twenty service functions, where the failure mode
 * is a function somebody forgot: a guard that has to be repeated is a guard
 * that will be missed, and a missing one here is another building's records.
 *
 * `findBuildingId` answers which building the record belongs to, or null when
 * there is no such record. Both cases end the same way — NOT FOUND — because a
 * record the caller may not see must be indistinguishable from one that does
 * not exist, or an id becomes a way to count what exists elsewhere.
 *
 * A malformed id is passed through untouched: the handler's own parser reports
 * that, and it reports it better.
 */
export function requireParamInScope(
  notFound: { code: string; label: string },
  findBuildingId: (id: number) => Promise<number | null>,
) {
  return async function paramGuard(
    req: Request,
    _res: Response,
    next: NextFunction,
    value: string,
  ) {
    const scope = req.buildingScope ?? null;
    if (scope === null) {
      next();
      return;
    }

    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) {
      next();
      return;
    }

    const buildingId = await findBuildingId(id);
    if (buildingId === null || !scope.includes(buildingId)) {
      next(new NotFoundError(notFound.code, `${notFound.label} not found`));
      return;
    }

    next();
  };
}
