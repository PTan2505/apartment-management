import { z } from "zod";
import { paginationQueryFields } from "@/lib/pagination.js";

const rate = z.coerce.number().nonnegative("must not be negative");

export const createBuildingSchema = z.object({
  displayName: z.string().min(1, "displayName is required"),
  // The street line only. Ward, city and country are held separately so
  // buildings can be filtered by location.
  address: z.string().min(1, "address is required"),
  ward: z.string().min(1, "ward is required"),
  city: z.string().min(1, "city is required"),
  country: z.string().min(1).default("Vietnam"),
  electricityRate: rate,
  waterRatePerPerson: rate,
  // Where the address was resolved from. Optional: an address may be typed by
  // hand, and then no such place exists. Recording it makes a future
  // re-resolution possible without re-entering the address from memory.
  placeId: z.string().min(1).optional(),
});

export const updateBuildingSchema = z
  .object({
    displayName: z.string().min(1),
    address: z.string().min(1),
    ward: z.string().min(1),
    city: z.string().min(1),
    country: z.string().min(1),
    electricityRate: rate,
    waterRatePerPerson: rate,
    // Nullable as well as optional: clearing it is meaningful. After an address
    // is corrected by hand, leaving the identifier would claim the address came
    // from a place it no longer matches.
    placeId: z.string().min(1).nullable(),
  })
  .partial();

export const listBuildingsQuerySchema = z.object({
  ...paginationQueryFields,
  // Partial and case-insensitive, matching the room-code search convention.
  ward: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  /**
   * Which statuses to list: in service, out of service, or both.
   *
   * Three-valued rather than an include-inactive flag, because "only what I
   * have taken out of service" is a question the owner asks while tidying up
   * and a flag that only widens the result cannot express it.
   *
   * Defaults to in-service, so callers that never asked about retirement —
   * the tenancy form's room picker among them — are unaffected. An
   * unrecognised value is a 400 rather than a silent default.
   */
  status: z.enum(["active", "inactive", "all"]).default("active"),
});

// Deliberately the same shape as the listing filter above: a location offered
// as a filter choice must not produce an empty result, so the two have to agree
// on what counts as visible.
export const buildingLocationsQuerySchema = z.object({
  status: z.enum(["active", "inactive", "all"]).default("active"),
});

export type BuildingLocationsQuery = z.infer<typeof buildingLocationsQuerySchema>;
export type CreateBuildingInput = z.infer<typeof createBuildingSchema>;
export type UpdateBuildingInput = z.infer<typeof updateBuildingSchema>;
export type ListBuildingsQuery = z.infer<typeof listBuildingsQuerySchema>;
