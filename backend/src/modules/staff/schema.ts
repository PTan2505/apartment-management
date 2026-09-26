import { z } from "zod";

/**
 * A phone number as this system stores one: digits, as typed, unique among
 * accounts. The same shape the customer module accepts, because the same
 * person may hold both records in a small building.
 */
const phone = z
  .string()
  .trim()
  .min(8, "phone number is too short")
  .max(20, "phone number is too long");

export const createStaffSchema = z.object({
  phone,
  fullName: z.string().trim().min(1, "fullName is required").max(120),
  // Deliberately not `Role`: an owner is not created this way, and a customer
  // is not staff. Naming the two here means a widened enum cannot quietly
  // become creatable from this endpoint.
  role: z.enum(["manager", "maintenance"]),
  /** Buildings to cover from the start. Optional: the owner may assign later. */
  buildingIds: z.array(z.coerce.number().int().positive()).optional(),
});

export const updateStaffSchema = z.object({
  fullName: z.string().trim().min(1).max(120).optional(),
  phone: phone.optional(),
});

export const assignBuildingsSchema = z.object({
  /** The complete set. Sending a shorter list unassigns what is missing. */
  buildingIds: z.array(z.coerce.number().int().positive()),
});

export const listStaffQuerySchema = z.object({
  role: z.enum(["manager", "maintenance"]).optional(),
  status: z.enum(["active", "inactive", "all"]).default("active"),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type AssignBuildingsInput = z.infer<typeof assignBuildingsSchema>;
export type ListStaffQuery = z.infer<typeof listStaffQuerySchema>;
