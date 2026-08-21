import { z } from "zod";
import { paginationQueryFields } from "@/lib/pagination.js";

// Zero is accepted: a service included at no charge is a real arrangement, and
// refusing it would force the owner to invent a price or not record the service.
const money = z.coerce.number().nonnegative("must not be negative");

export const createServiceFeeSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  unitAmount: money,
});

export const updateServiceFeeSchema = z
  .object({
    name: z.string().trim().min(1, "name is required"),
    unitAmount: money,
  })
  .partial();

export const listServiceFeesQuerySchema = z.object({
  ...paginationQueryFields,
  includeInactive: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

// Quantity defaults to one so a flat fee — internet, rubbish — needs no input.
// A flat fee and a per-unit fee taken once behave identically everywhere, so
// there is no second kind of fee to model.
export const selectServiceFeeSchema = z.object({
  buildingServiceFeeId: z.coerce.number().int().positive("buildingServiceFeeId is required"),
  quantity: z.coerce.number().int().min(1, "must be at least 1").default(1),
  // Optional: the service defaults it to the lease's start date, which is when
  // a fee agreed at signing began applying. Supply it for a service taken up
  // partway through a tenancy.
  effectiveFrom: z.coerce.date().optional(),
});

// Giving up a fee records when it stopped, rather than deleting the record —
// a month already lived through still has to be billable.
export const endServiceFeeSchema = z.object({
  effectiveTo: z.coerce.date().optional(),
});

export const updateSelectionSchema = z.object({
  quantity: z.coerce.number().int().min(1, "must be at least 1"),
});

export type CreateServiceFeeInput = z.infer<typeof createServiceFeeSchema>;
export type UpdateServiceFeeInput = z.infer<typeof updateServiceFeeSchema>;
export type ListServiceFeesQuery = z.infer<typeof listServiceFeesQuerySchema>;
export type SelectServiceFeeInput = z.infer<typeof selectServiceFeeSchema>;
export type EndServiceFeeInput = z.infer<typeof endServiceFeeSchema>;
export type UpdateSelectionInput = z.infer<typeof updateSelectionSchema>;
