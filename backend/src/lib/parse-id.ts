import { NotFoundError } from "@/lib/errors.js";

/**
 * Parses a numeric id from a route parameter.
 *
 * Express always hands params over as strings, so `/rooms/abc` reaches the
 * handler as "abc". That id cannot exist, so this raises NotFoundError rather
 * than a validation error — matching the behaviour when ids were opaque
 * strings, where any unknown value simply produced a 404.
 */
/**
 * The things a route can address by id, each with the code its absence reports.
 *
 * A closed table rather than a string the caller passes: the code has to be a
 * fixed identifier another system can branch on, and one built by pasting a
 * resource name into a template is neither fixed nor reviewable — it would
 * change the moment somebody improved the wording of a label.
 */
export const RESOURCE = {
  building: { code: "BUILDING_NOT_FOUND", label: "Building" },
  room: { code: "ROOM_NOT_FOUND", label: "Room" },
  customer: { code: "CUSTOMER_NOT_FOUND", label: "Customer" },
  lease: { code: "LEASE_NOT_FOUND", label: "Lease" },
  occupant: { code: "OCCUPANT_NOT_FOUND", label: "Occupant" },
  invoice: { code: "INVOICE_NOT_FOUND", label: "Invoice" },
  payment: { code: "PAYMENT_NOT_FOUND", label: "Payment" },
  expense: { code: "EXPENSE_NOT_FOUND", label: "Expense" },
  serviceFee: { code: "SERVICE_FEE_NOT_FOUND", label: "Service fee" },
  leaseServiceFee: { code: "LEASE_SERVICE_FEE_NOT_FOUND", label: "Lease service fee" },
} as const;

export type Resource = (typeof RESOURCE)[keyof typeof RESOURCE];

export function parseIdParam(
  value: string | string[] | undefined,
  resource: Resource,
): number {
  // Express types wildcard params as string[]; a single :id segment is a string.
  if (typeof value !== "string") {
    throw new NotFoundError(resource.code, `${resource.label} not found`);
  }

  const id = Number(value);

  if (!Number.isInteger(id) || id < 1) {
    throw new NotFoundError(resource.code, `${resource.label} not found`);
  }

  return id;
}
