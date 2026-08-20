import type { Request, Response } from "express";
import { ValidationError } from "@/lib/errors.js";
import { parseIdParam } from "@/lib/parse-id.js";
import {
  createServiceFeeSchema,
  updateServiceFeeSchema,
  listServiceFeesQuerySchema,
  selectServiceFeeSchema,
  updateSelectionSchema,
} from "./schema.js";
import { toLeaseServiceFeeResponse } from "./mapper.js";
import * as serviceFeeService from "./service.js";

// ── A building's catalogue ───────────────────────────────────────────────────

export async function createServiceFeeHandler(req: Request, res: Response) {
  const parsed = createServiceFeeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Invalid service fee payload", parsed.error.flatten());
  }

  const fee = await serviceFeeService.createServiceFee(
    parseIdParam(req.params.buildingId, "Building"),
    parsed.data,
  );
  res.status(201).json(fee);
}

export async function listServiceFeesHandler(req: Request, res: Response) {
  const parsed = listServiceFeesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ValidationError("Invalid query parameters", parsed.error.flatten());
  }

  const fees = await serviceFeeService.listServiceFees(
    parseIdParam(req.params.buildingId, "Building"),
    parsed.data,
  );
  res.status(200).json(fees);
}

export async function updateServiceFeeHandler(req: Request, res: Response) {
  const parsed = updateServiceFeeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Invalid service fee payload", parsed.error.flatten());
  }

  const fee = await serviceFeeService.updateServiceFee(
    parseIdParam(req.params.feeId, "Service fee"),
    parsed.data,
  );
  res.status(200).json(fee);
}

export async function retireServiceFeeHandler(req: Request, res: Response) {
  const fee = await serviceFeeService.retireServiceFee(
    parseIdParam(req.params.feeId, "Service fee"),
  );
  res.status(200).json(fee);
}

export async function restoreServiceFeeHandler(req: Request, res: Response) {
  const fee = await serviceFeeService.restoreServiceFee(
    parseIdParam(req.params.feeId, "Service fee"),
  );
  res.status(200).json(fee);
}

// ── A lease's selections ─────────────────────────────────────────────────────

export async function listLeaseServiceFeesHandler(req: Request, res: Response) {
  const rows = await serviceFeeService.listLeaseServiceFees(
    parseIdParam(req.params.id, "Lease"),
  );
  res.status(200).json({ serviceFees: rows.map(toLeaseServiceFeeResponse) });
}

export async function selectServiceFeeHandler(req: Request, res: Response) {
  const parsed = selectServiceFeeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Invalid service fee selection", parsed.error.flatten());
  }

  const row = await serviceFeeService.selectServiceFee(
    parseIdParam(req.params.id, "Lease"),
    parsed.data,
  );
  res.status(201).json(toLeaseServiceFeeResponse(row));
}

export async function updateLeaseServiceFeeHandler(req: Request, res: Response) {
  const parsed = updateSelectionSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Invalid service fee selection", parsed.error.flatten());
  }

  const row = await serviceFeeService.updateLeaseServiceFee(
    parseIdParam(req.params.id, "Lease"),
    parseIdParam(req.params.selectionId, "Lease service fee"),
    parsed.data,
  );
  res.status(200).json(toLeaseServiceFeeResponse(row));
}

export async function removeLeaseServiceFeeHandler(req: Request, res: Response) {
  await serviceFeeService.removeLeaseServiceFee(
    parseIdParam(req.params.id, "Lease"),
    parseIdParam(req.params.selectionId, "Lease service fee"),
  );
  res.status(204).send();
}
