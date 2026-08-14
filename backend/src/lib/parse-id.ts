import { NotFoundError } from "@/lib/errors.js";

/**
 * Parses a numeric id from a route parameter.
 *
 * Express always hands params over as strings, so `/rooms/abc` reaches the
 * handler as "abc". That id cannot exist, so this raises NotFoundError rather
 * than a validation error — matching the behaviour when ids were opaque
 * strings, where any unknown value simply produced a 404.
 */
export function parseIdParam(
  value: string | string[] | undefined,
  resource: string,
): number {
  // Express types wildcard params as string[]; a single :id segment is a string.
  if (typeof value !== "string") {
    throw new NotFoundError(`${resource} not found`);
  }

  const id = Number(value);

  if (!Number.isInteger(id) || id < 1) {
    throw new NotFoundError(`${resource} not found`);
  }

  return id;
}
