import { z } from "zod";

const isoDate = z.coerce.date();

export const createLeaseSchema = z.object({
  roomId: z.string().min(1, "roomId is required"),
  signatoryId: z.string().min(1, "signatoryId is required"),
  startDate: isoDate,
  durationMonths: z.coerce.number().int().min(1, "must be at least 1"),
  occupantCount: z.coerce.number().int().min(1, "must be at least 1"),
});

export const updateLeaseSchema = z
  .object({
    durationMonths: z.coerce.number().int().min(1, "must be at least 1"),
    occupantCount: z.coerce.number().int().min(1, "must be at least 1"),
  })
  .partial();

export const moveOutSchema = z.object({
  moveOutDate: isoDate,
});

export const listLeasesQuerySchema = z.object({
  roomId: z.string().min(1).optional(),
  customerId: z.string().min(1).optional(),
  active: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
});

export const addOccupantSchema = z.object({
  customerId: z.string().min(1, "customerId is required"),
  joinedAt: isoDate.optional(),
});

export const departOccupantSchema = z.object({
  leftAt: isoDate,
});

export const transferPrimarySchema = z.object({
  customerId: z.string().min(1, "customerId is required"),
});

export type CreateLeaseInput = z.infer<typeof createLeaseSchema>;
export type UpdateLeaseInput = z.infer<typeof updateLeaseSchema>;
export type ListLeasesQuery = z.infer<typeof listLeasesQuerySchema>;
export type AddOccupantInput = z.infer<typeof addOccupantSchema>;
