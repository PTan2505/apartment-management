import { z } from "zod";

import { paginationQueryFields } from "@/lib/pagination.js";

/**
 * The four conditions, and no fifth.
 *
 * Fixed because the only reason a condition is stored is so the one at
 * hand-over can be COMPARED with the one at return. Free text makes "hơi xước"
 * and "xước nhẹ" two different conditions, and nothing can compare them.
 */
export const FURNITURE_CONDITIONS = ["new", "good", "worn", "damaged"] as const;
export type FurnitureConditionValue = (typeof FURNITURE_CONDITIONS)[number];

const condition = z.enum(FURNITURE_CONDITIONS);
const note = z.string().trim().max(300).optional();
const isoDate = z.coerce.date();

/* ---------------- the building's catalogue ---------------- */

export const createFurnitureItemSchema = z.object({
  name: z.string().trim().min(1, "tên là bắt buộc").max(120),
  /** Loại — free text, unlike condition. See the schema comment on the model. */
  kind: z.string().trim().min(1, "loại là bắt buộc").max(60),
  make: z.string().trim().max(80).optional(),
  unitValue: z.coerce.number().nonnegative("không được âm"),
});

export const updateFurnitureItemSchema = createFurnitureItemSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "không có gì để cập nhật" });

export const listFurnitureItemsQuerySchema = z.object({
  ...paginationQueryFields,
  /** Retired entries stay visible to the owner, set apart. */
  includeInactive: z.coerce.boolean().default(false),
});

/* ---------------- what a room holds ---------------- */

export const addRoomFurnitureSchema = z.object({
  furnitureItemId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive("số lượng phải lớn hơn 0"),
  condition: condition.default("good"),
  note,
  /**
   * Optional: defaults to today. Supplied when an owner records furniture that
   * has been in the room for years — the date it arrived is a fact about the
   * item, not about when somebody got round to typing it.
   */
  acquiredOn: isoDate.optional(),
});

export const updateRoomFurnitureSchema = z
  .object({
    quantity: z.coerce.number().int().positive("số lượng phải lớn hơn 0"),
    condition,
    note: z.string().trim().max(300).nullable(),
    acquiredOn: isoDate,
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "không có gì để cập nhật" });

/* ---------------- checking the furniture back in ---------------- */

/**
 * A condition at return, per hand-over entry.
 *
 * Every field optional at the list level: a move-out must never be blocked by
 * an inventory, and an item left out of this list stays UNCHECKED rather than
 * being recorded as returned in good order.
 */
export const checkInFurnitureSchema = z.array(
  z.object({
    leaseFurnitureId: z.coerce.number().int().positive(),
    returnCondition: condition,
    returnNote: note,
  }),
);

export type CreateFurnitureItemInput = z.infer<typeof createFurnitureItemSchema>;
export type UpdateFurnitureItemInput = z.infer<typeof updateFurnitureItemSchema>;
export type ListFurnitureItemsQuery = z.infer<typeof listFurnitureItemsQuerySchema>;
export type AddRoomFurnitureInput = z.infer<typeof addRoomFurnitureSchema>;
export type UpdateRoomFurnitureInput = z.infer<typeof updateRoomFurnitureSchema>;
export type CheckInFurnitureInput = z.infer<typeof checkInFurnitureSchema>;
