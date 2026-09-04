import type { Request, Response } from "express";
import { ValidationError } from "@/lib/errors.js";
import { parseIdParam, RESOURCE } from "@/lib/parse-id.js";
import {
  generateInvoiceSchema,
  issueAdhocInvoiceSchema,
  markPaidSchema,
  listInvoicesQuerySchema,
  listDueQuerySchema,
  voidInvoiceSchema,
} from "./schema.js";
import * as invoiceService from "./service.js";

export async function generateInvoiceHandler(req: Request, res: Response) {
  const parsed = generateInvoiceSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("INVOICE_PAYLOAD_INVALID", "Invalid invoice payload", parsed.error.flatten());
  }

  const invoice = await invoiceService.generateInvoice(parsed.data);
  res.status(201).json(invoice);
}

export async function listInvoicesHandler(req: Request, res: Response) {
  const parsed = listInvoicesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ValidationError("QUERY_INVALID", "Invalid query parameters", parsed.error.flatten());
  }

  const invoices = await invoiceService.listInvoices(parsed.data);
  res.status(200).json(invoices);
}

export async function listDueHandler(req: Request, res: Response) {
  const parsed = listDueQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ValidationError("QUERY_INVALID", "Invalid query parameters", parsed.error.flatten());
  }

  const due = await invoiceService.listDueForMonth(parsed.data);
  // A bare array, not a paginated envelope: this is a worklist rather than a
  // page of records, and nothing about it is navigable.
  res.status(200).json({ data: due });
}

export async function getInvoiceHandler(req: Request, res: Response) {
  const invoice = await invoiceService.getInvoiceById(parseIdParam(req.params.id, RESOURCE.invoice));
  res.status(200).json(invoice);
}

export async function markPaidHandler(req: Request, res: Response) {
  const parsed = markPaidSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("PAYMENT_PAYLOAD_INVALID", "Invalid payment payload", parsed.error.flatten());
  }

  const invoice = await invoiceService.markPaid(
    parseIdParam(req.params.id, RESOURCE.invoice),
    parsed.data,
  );
  res.status(200).json(invoice);
}

export async function voidInvoiceHandler(req: Request, res: Response) {
  const parsed = voidInvoiceSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new ValidationError("INVOICE_VOID_PAYLOAD_INVALID", "Invalid void payload", parsed.error.flatten());
  }

  const invoice = await invoiceService.voidInvoice(
    parseIdParam(req.params.id, RESOURCE.invoice),
    parsed.data,
  );
  res.status(200).json(invoice);
}

export async function issueAdhocInvoiceHandler(req: Request, res: Response) {
  const parsed = issueAdhocInvoiceSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("ADHOC_INVOICE_PAYLOAD_INVALID", "Invalid ad-hoc invoice payload", parsed.error.flatten());
  }

  const invoice = await invoiceService.issueAdhocInvoice(parsed.data);
  res.status(201).json(invoice);
}
