import { z } from "zod";
import { paginationQueryFields } from "@/lib/pagination.js";

export const generateInvoiceSchema = z.object({
  leaseId: z.coerce.number().int().positive("leaseId is required"),
  year: z.coerce.number().int().min(2000).max(2200),
  month: z.coerce.number().int().min(1).max(12),
  currentElectricityUse: z.coerce.number().int().nonnegative("must not be negative"),
});

export const markPaidSchema = z.object({
  paymentMethod: z.enum(["cash", "bank_transfer"]),
  paidAt: z.coerce.date(),
});

export const listInvoicesQuerySchema = z.object({
  ...paginationQueryFields,
  buildingId: z.coerce.number().int().positive().optional(),
  roomId: z.coerce.number().int().positive().optional(),
  leaseId: z.coerce.number().int().positive().optional(),
  year: z.coerce.number().int().min(2000).max(2200).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  paymentStatus: z.enum(["pending", "paid"]).optional(),
  // Voided invoices are excluded by default — they are an audit trail, not a
  // live bill — but remain retrievable when explicitly asked for.
  includeVoided: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export type GenerateInvoiceInput = z.infer<typeof generateInvoiceSchema>;
export type MarkPaidInput = z.infer<typeof markPaidSchema>;
export type ListInvoicesQuery = z.infer<typeof listInvoicesQuerySchema>;
