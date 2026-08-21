import { z } from "zod";
import { paginationQueryFields } from "@/lib/pagination.js";

export const generateInvoiceSchema = z.object({
  leaseId: z.coerce.number().int().positive("leaseId is required"),
  year: z.coerce.number().int().min(2000).max(2200),
  month: z.coerce.number().int().min(1).max(12),
  currentElectricityUse: z.coerce.number().int().nonnegative("must not be negative"),
  // When the owner billed this, defaulting to now. Supplied for a month billed
  // late, so a batch of catch-up invoices does not all land in the month
  // somebody happened to enter them.
  //
  // Deliberately no `type` here: the kind of an invoice is decided by which
  // operation issued it, never by a caller. This one issues monthly invoices.
  issueDate: z.coerce.date().optional(),
});

export const markPaidSchema = z.object({
  // deposit_deduction settles a bill out of money already held for the lease.
  // The bill is genuinely collected — that money reached the owner months ago —
  // and it differs from the others in where the money came from, not in whether
  // it arrived.
  paymentMethod: z.enum(["cash", "bank_transfer", "deposit_deduction"]),
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
