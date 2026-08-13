import { z } from "zod";

const rate = z.coerce.number().nonnegative("must not be negative");

export const createBuildingSchema = z.object({
  displayName: z.string().min(1, "displayName is required"),
  address: z.string().min(1, "address is required"),
  electricityRate: rate,
  waterRatePerPerson: rate,
});

export const updateBuildingSchema = z
  .object({
    displayName: z.string().min(1),
    address: z.string().min(1),
    electricityRate: rate,
    waterRatePerPerson: rate,
  })
  .partial();

export const listBuildingsQuerySchema = z.object({
  includeInactive: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export type CreateBuildingInput = z.infer<typeof createBuildingSchema>;
export type UpdateBuildingInput = z.infer<typeof updateBuildingSchema>;
