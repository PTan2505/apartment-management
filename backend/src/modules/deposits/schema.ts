import { z } from "zod";
import { paginationQueryFields } from "@/lib/pagination.js";

export const listDepositsQuerySchema = z.object({
  ...paginationQueryFields,
  buildingId: z.coerce.number().int().positive().optional(),
});

export const refundDepositSchema = z.object({
  // Decided by the owner, never computed. The deduction for a damaged room is
  // a fact the system cannot hold, and proposing `held − deducted` would be
  // right most of the time and silently wrong exactly when it is not.
  amount: z.coerce.number().nonnegative("must not be negative"),
  refundedAt: z.coerce.date(),
  // Why the return differed from what was held. Free text because the reason
  // is not something the system can enumerate.
  note: z.string().trim().min(1).max(500).optional(),
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
