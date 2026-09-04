import type { Request, Response } from "express";
import { ValidationError } from "@/lib/errors.js";
import { parseIdParam, RESOURCE } from "@/lib/parse-id.js";
import {
  createServiceFeeSchema,
  updateServiceFeeSchema,
  listServiceFeesQuerySchema,
  selectServiceFeeSchema,
  updateSelectionSchema,
  endServiceFeeSchema,
} from "./schema.js";
import { toLeaseServiceFeeResponse } from "./mapper.js";
import * as serviceFeeService from "./service.js";

// ── A building's catalogue ───────────────────────────────────────────────────

export async function createServiceFeeHandler(req: Request, res: Response) {
  const parsed = createServiceFeeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("SERVICE_FEE_PAYLOAD_INVALID", "Invalid service fee payload", parsed.error.flatten());
  }

  const fee = await serviceFeeService.createServiceFee(
    parseIdParam(req.params.buildingId, RESOURCE.building),
    parsed.data,
  );
  res.status(201).json(fee);
}

export async function listServiceFeesHandler(req: Request, res: Response) {
  const parsed = listServiceFeesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ValidationError("QUERY_INVALID", "Invalid query parameters", parsed.error.flatten());
  }

  const fees = await serviceFeeService.listServiceFees(
    parseIdParam(req.params.buildingId, RESOURCE.building),
    parsed.data,
  );
  res.status(200).json(fees);
}

export async function updateServiceFeeHandler(req: Request, res: Response) {
  const parsed = updateServiceFeeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("SERVICE_FEE_PAYLOAD_INVALID", "Invalid service fee payload", parsed.error.flatten());
  }

  const fee = await serviceFeeService.updateServiceFee(
    parseIdParam(req.params.feeId, RESOURCE.serviceFee),
    parsed.data,
  );
  res.status(200).json(fee);
}

export async function retireServiceFeeHandler(req: Request, res: Response) {
  const fee = await serviceFeeService.retireServiceFee(
    parseIdParam(req.params.feeId, RESOURCE.serviceFee),
  );
  res.status(200).json(fee);
}

export async function restoreServiceFeeHandler(req: Request, res: Response) {
  const fee = await serviceFeeService.restoreServiceFee(
    parseIdParam(req.params.feeId, RESOURCE.serviceFee),
  );
  res.status(200).json(fee);
}

// ── A lease's selections ─────────────────────────────────────────────────────

export async function listLeaseServiceFeesHandler(req: Request, res: Response) {
  const rows = await serviceFeeService.listLeaseServiceFees(
    parseIdParam(req.params.id, RESOURCE.lease),
  );
  res.status(200).json({ serviceFees: rows.map(toLeaseServiceFeeResponse) });
}

export async function selectServiceFeeHandler(req: Request, res: Response) {
  const parsed = selectServiceFeeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("SERVICE_FEE_SELECTION_INVALID", "Invalid service fee selection", parsed.error.flatten());
  }

  const row = await serviceFeeService.selectServiceFee(
    parseIdParam(req.params.id, RESOURCE.lease),
    parsed.data,
  );
  res.status(201).json(toLeaseServiceFeeResponse(row));
}

export async function updateLeaseServiceFeeHandler(req: Request, res: Response) {
  const parsed = updateSelectionSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("SERVICE_FEE_SELECTION_INVALID", "Invalid service fee selection", parsed.error.flatten());
  }

  const row = await serviceFeeService.updateLeaseServiceFee(
    parseIdParam(req.params.id, RESOURCE.lease),
    parseIdParam(req.params.selectionId, RESOURCE.leaseServiceFee),
    parsed.data,
  );
  res.status(200).json(toLeaseServiceFeeResponse(row));
}

/**
 * Answers 200 with the ended record rather than 204, because giving a fee up
 * now records a date instead of removing it — the caller gets back the period
 * it applied for.
 */
export async function endLeaseServiceFeeHandler(req: Request, res: Response) {
  const parsed = endServiceFeeSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new ValidationError("SERVICE_FEE_PAYLOAD_INVALID", "Invalid service fee payload", parsed.error.flatten());
  }

  const row = await serviceFeeService.endLeaseServiceFee(
    parseIdParam(req.params.id, RESOURCE.lease),
    parseIdParam(req.params.selectionId, RESOURCE.leaseServiceFee),
    parsed.data,
  );
  res.status(200).json(toLeaseServiceFeeResponse(row));
}
