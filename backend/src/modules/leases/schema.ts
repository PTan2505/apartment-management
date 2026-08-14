import { z } from "zod";
import { paginationQueryFields } from "@/lib/pagination.js";

const isoDate = z.coerce.date();

export const createLeaseSchema = z.object({
  roomId: z.coerce.number().int().positive("roomId is required"),
  signatoryId: z.coerce.number().int().positive("signatoryId is required"),
  startDate: isoDate,
  durationMonths: z.coerce.number().int().min(1, "must be at least 1"),
  occupantCount: z.coerce.number().int().min(1, "must be at least 1"),
  // Optional here: the service defaults it to the previous lease's closing
  // reading, and rejects omission only when the room has no previous lease.
  startMeterReading: z.coerce.number().int().nonnegative("must not be negative").optional(),
});

export const updateLeaseSchema = z
  .object({
    durationMonths: z.coerce.number().int().min(1, "must be at least 1"),
    occupantCount: z.coerce.number().int().min(1, "must be at least 1"),
  })
  .partial();

export const moveOutSchema = z.object({
  moveOutDate: isoDate,
  endMeterReading: z.coerce.number().int().nonnegative("must not be negative"),
});

export const listLeasesQuerySchema = z.object({
  ...paginationQueryFields,
  roomId: z.coerce.number().int().positive().optional(),
  customerId: z.coerce.number().int().positive().optional(),
  active: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
});

export const addOccupantSchema = z.object({
  customerId: z.coerce.number().int().positive("customerId is required"),
  joinedAt: isoDate.optional(),
});

export const departOccupantSchema = z.object({
  leftAt: isoDate,
});

export const transferPrimarySchema = z.object({
  customerId: z.coerce.number().int().positive("customerId is required"),
});

export const listOccupantsQuerySchema = z.object({ ...paginationQueryFields });

export type ListOccupantsQuery = z.infer<typeof listOccupantsQuerySchema>;
export type CreateLeaseInput = z.infer<typeof createLeaseSchema>;
export type UpdateLeaseInput = z.infer<typeof updateLeaseSchema>;
export type ListLeasesQuery = z.infer<typeof listLeasesQuerySchema>;
export type AddOccupantInput = z.infer<typeof addOccupantSchema>;
