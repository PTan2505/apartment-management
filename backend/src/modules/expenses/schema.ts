import { z } from "zod";
import { paginationQueryFields } from "@/lib/pagination.js";

const money = z.coerce.number().positive("must be greater than zero");

export const createExpenseSchema = z.object({
  buildingId: z.coerce.number().int().positive("buildingId is required"),
  roomId: z.coerce.number().int().positive().optional(),
  category: z.enum(["vacancy_electricity", "cleaning", "repair", "other"]),
  description: z.string().min(1, "description is required"),
  incurredAt: z.coerce.date(),
  // When both are supplied the amount is computed from them, so a caller
  // cannot record a figure that disagrees with the numbers it came from.
  quantity: z.coerce.number().positive().optional(),
  unitRate: z.coerce.number().nonnegative().optional(),
  amount: money.optional(),
});

export const updateExpenseSchema = z
  .object({
    category: z.enum(["vacancy_electricity", "cleaning", "repair", "other"]),
    description: z.string().min(1),
    incurredAt: z.coerce.date(),
    amount: money,
  })
  .partial();

export const recordVacancySchema = z.object({
  roomId: z.coerce.number().int().positive("roomId is required"),
  year: z.coerce.number().int().min(2000).max(2200),
  month: z.coerce.number().int().min(1).max(12),
  currentReading: z.coerce.number().int().nonnegative("must not be negative"),
});

export const listExpensesQuerySchema = z.object({
  ...paginationQueryFields,
  buildingId: z.coerce.number().int().positive().optional(),
  roomId: z.coerce.number().int().positive().optional(),
  category: z.enum(["vacancy_electricity", "cleaning", "repair", "other"]).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type RecordVacancyInput = z.infer<typeof recordVacancySchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
