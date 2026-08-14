import { z } from "zod";

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
  buildingId: z.coerce.number().int().positive().optional(),
  includeInactive: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type ListRoomsQuery = z.infer<typeof listRoomsQuerySchema>;
