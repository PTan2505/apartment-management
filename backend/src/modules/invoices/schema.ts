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

/**
 * A bill for what cannot be calculated. Every other charge in this system
 * follows from an agreement and a measurement; these follow from a judgement,
 * and the owner makes it.
 */
export const issueAdhocInvoiceSchema = z.object({
  leaseId: z.coerce.number().int().positive("leaseId is required"),
  charges: z
    .array(
      z.object({
        // Fixed rather than free text so charges of a kind can be grouped and
        // compared across tenancies — and compared against the expenses they
        // correspond to, which is why the set mirrors ExpenseCategory.
        category: z.enum(["damage", "cleaning", "lost_item", "penalty", "other"]),
        // What actually happened, written for whoever reads the bill.
        description: z.string().trim().min(1, "description is required").max(500),
        amount: z.coerce.number().nonnegative("must not be negative"),
      }),
    )
    // An invoice for nothing records nothing. Distinct from the overdue
    // invoice, where an empty list is a deliberate waiver of days that did
    // happen; here there is no event to waive.
    .min(1, "an ad-hoc invoice must carry at least one charge"),
  issueDate: z.coerce.date().optional(),
  // Deliberately no `type`: the kind of an invoice follows from the operation
  // that issued it, never from a caller. This one issues ad-hoc invoices.
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
export type IssueAdhocInvoiceInput = z.infer<typeof issueAdhocInvoiceSchema>;
export type ListInvoicesQuery = z.infer<typeof listInvoicesQuerySchema>;
