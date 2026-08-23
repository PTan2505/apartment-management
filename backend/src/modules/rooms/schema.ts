import { z } from "zod";
import { paginationQueryFields } from "@/lib/pagination.js";

const money = z.coerce.number().nonnegative("must not be negative");

export const createRoomSchema = z.object({
  buildingId: z.coerce.number().int().positive("buildingId is required"),
  roomCode: z.string().min(1, "roomCode is required"),
  baseRent: money,
});

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
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type ListRoomsQuery = z.infer<typeof listRoomsQuerySchema>;
