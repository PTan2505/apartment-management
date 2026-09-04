import { z } from "zod";
import { paginationQueryFields } from "@/lib/pagination.js";

const money = z.coerce.number().nonnegative("must not be negative");

export const createRoomSchema = z.object({
  buildingId: z.coerce.number().int().positive("buildingId is required"),
  roomCode: z.string().min(1, "roomCode is required"),
  baseRent: money,
  /**
   * Where the meter stands right now.
   *
   * Optional, because rooms already exist without one and no figure can
   * honestly be invented for them. Zero is accepted as a STATED value and is
   * not the same as omitting it — a meter genuinely at zero and a meter nobody
   * read are different facts, and treating them alike is what would charge an
   * owner for a meter's entire history as one month of vacancy consumption.
   */
  initialMeterReading: z.coerce
    .number()
    .int("must be a whole number")
    .nonnegative("must not be negative")
    .optional(),
});

/**
 * Deliberately no meter reading here. It describes the moment the room was
 * added: once any tenancy or vacancy record exists, the room's position comes
 * from those instead, so editing it would either change nothing visible or
 * rewrite the basis of costs already recorded against it. Correcting those is
 * done by correcting the records that hold them.
 */
export const updateRoomSchema = z
  .object({
    roomCode: z.string().min(1),
    baseRent: money,
  })
  .partial();

export const listRoomsQuerySchema = z.object({
  ...paginationQueryFields,
  buildingId: z.coerce.number().int().positive().optional(),
  // Partial, case-insensitive match on room code — a lookup affordance for
  // scanning a list, matching the `search` parameter on /customers. Not an
  // exact-identifier fetch: searching "10" surfaces 10, 101 and 102.
  search: z.string().min(1).optional(),
  includeInactive: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
  // Rooms with no running tenancy — the ones that can be let. Combinable with
  // the filters above, so "which rooms in this building are free" is one
  // request rather than a list minus a list the caller has to work out.
  vacant: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type ListRoomsQuery = z.infer<typeof listRoomsQuerySchema>;
