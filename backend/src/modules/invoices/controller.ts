import type { Request, Response } from "express";
import { ValidationError } from "@/lib/errors.js";
import { parseIdParam } from "@/lib/parse-id.js";
import {
  generateInvoiceSchema,
  issueAdhocInvoiceSchema,
  markPaidSchema,
  listInvoicesQuerySchema,
} from "./schema.js";
import * as invoiceService from "./service.js";

export async function generateInvoiceHandler(req: Request, res: Response) {
  const parsed = generateInvoiceSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Invalid invoice payload", parsed.error.flatten());
  }

  const invoice = await invoiceService.generateInvoice(parsed.data);
  res.status(201).json(invoice);
}

export async function listInvoicesHandler(req: Request, res: Response) {
  const parsed = listInvoicesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ValidationError("Invalid query parameters", parsed.error.flatten());
  }

  const invoices = await invoiceService.listInvoices(parsed.data);
  res.status(200).json(invoices);
}

export async function getInvoiceHandler(req: Request, res: Response) {
  const invoice = await invoiceService.getInvoiceById(parseIdParam(req.params.id, "Invoice"));
  res.status(200).json(invoice);
}

export async function markPaidHandler(req: Request, res: Response) {
  const parsed = markPaidSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Invalid payment payload", parsed.error.flatten());
  }

  const invoice = await invoiceService.markPaid(
    parseIdParam(req.params.id, "Invoice"),
    parsed.data,
  );
  res.status(200).json(invoice);
}

export async function voidInvoiceHandler(req: Request, res: Response) {
  const invoice = await invoiceService.voidInvoice(parseIdParam(req.params.id, "Invoice"));
  res.status(200).json(invoice);
}

export async function issueAdhocInvoiceHandler(req: Request, res: Response) {
  const parsed = issueAdhocInvoiceSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Invalid ad-hoc invoice payload", parsed.error.flatten());
  }

  const invoice = await invoiceService.issueAdhocInvoice(parsed.data);
  res.status(201).json(invoice);
}
