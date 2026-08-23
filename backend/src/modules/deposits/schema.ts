import { z } from "zod";
import { paginationQueryFields } from "@/lib/pagination.js";

export const listDepositsQuerySchema = z.object({
  ...paginationQueryFields,
  buildingId: z.coerce.number().int().positive().optional(),
});

/**
 * A return hands back the WHOLE holding, so there is no amount to supply.
 *
 * Keeping part of a deposit requires charging for that part first, on an ad-hoc
 * invoice settled from the deposit. That is the point rather than a side
 * effect: an owner free to return less than they hold, giving only a sentence,
 * moves money out of the books entirely — not revenue, not an expense, no
 * longer a holding. Removing the amount closes that route instead of merely
 * offering a better one beside it.
 *
 * An amount sent anyway is ignored rather than refused, because the request has
 * no say in the figure at all.
 */
export const refundDepositSchema = z.object({
  refundedAt: z.coerce.date(),
});

export const adjustDepositSchema = z.object({
  // Signed: positive collects into the holding, negative hands part of it back.
  // One field rather than two, because a top-up and a partial return are the
  // same movement in opposite directions.
  amount: z.coerce
    .number()
    .refine((v) => v !== 0, "must not be zero — an adjustment of nothing records nothing"),
  note: z.string().trim().min(1).max(500).optional(),
});

export type ListDepositsQuery = z.infer<typeof listDepositsQuerySchema>;
export type RefundDepositInput = z.infer<typeof refundDepositSchema>;
export type AdjustDepositInput = z.infer<typeof adjustDepositSchema>;
