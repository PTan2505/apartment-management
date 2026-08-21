import type { Request, Response } from "express";
import { ValidationError } from "@/lib/errors.js";
import { parseIdParam } from "@/lib/parse-id.js";
import {
  adjustDepositSchema,
  listDepositsQuerySchema,
  refundDepositSchema,
} from "./schema.js";
import * as depositService from "./service.js";

export async function listHeldDepositsHandler(req: Request, res: Response) {
  const parsed = listDepositsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ValidationError("Invalid query parameters", parsed.error.flatten());
  }

  res.status(200).json(await depositService.listHeldDeposits(parsed.data));
}

export async function getSettlementHandler(req: Request, res: Response) {
  const leaseId = parseIdParam(req.params.id, "Lease");
  res.status(200).json(await depositService.getSettlement(leaseId));
}

export async function refundDepositHandler(req: Request, res: Response) {
  const parsed = refundDepositSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Invalid deposit refund payload", parsed.error.flatten());
  }

  const leaseId = parseIdParam(req.params.id, "Lease");
  res.status(200).json(await depositService.refundDeposit(leaseId, parsed.data));
}

export async function adjustDepositHandler(req: Request, res: Response) {
  const parsed = adjustDepositSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Invalid deposit adjustment payload", parsed.error.flatten());
  }

  const leaseId = parseIdParam(req.params.id, "Lease");
  res.status(200).json(await depositService.adjustDeposit(leaseId, parsed.data));
}
