import type { Request, Response } from "express";
import { ValidationError } from "@/lib/errors.js";
import { parseIdParam } from "@/lib/parse-id.js";
import { reversePaymentSchema } from "./schema.js";
import * as paymentService from "./service.js";

export async function getPaymentHandler(req: Request, res: Response) {
  res.status(200).json(await paymentService.getPaymentById(parseIdParam(req.params.id, "Payment")));
}

export async function listInvoicePaymentsHandler(req: Request, res: Response) {
  const invoiceId = parseIdParam(req.params.id, "Invoice");
  res.status(200).json({ payments: await paymentService.listPaymentsForInvoice(invoiceId) });
}

export async function reversePaymentHandler(req: Request, res: Response) {
  const parsed = reversePaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Invalid reversal payload", parsed.error.flatten());
  }

  const payment = await paymentService.reversePayment(
    parseIdParam(req.params.id, "Payment"),
    parsed.data,
  );
  res.status(200).json(payment);
}
