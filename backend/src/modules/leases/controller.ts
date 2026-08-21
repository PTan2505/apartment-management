import type { Request, Response } from "express";
import { ValidationError } from "@/lib/errors.js";
import { parseIdParam } from "@/lib/parse-id.js";
import { mapPaginated } from "@/lib/pagination.js";
import {
  createLeaseSchema,
  updateLeaseSchema,
  moveOutSchema,
  listLeasesQuerySchema,
  listOccupantsQuerySchema,
  addOccupantSchema,
  departOccupantSchema,
  transferPrimarySchema,
} from "./schema.js";
import { toLeaseResponse, toOccupantResponse } from "./mapper.js";
import * as leaseService from "./service.js";

export async function createLeaseHandler(req: Request, res: Response) {
  const parsed = createLeaseSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Invalid lease payload", parsed.error.flatten());
  }

  const lease = await leaseService.createLease(parsed.data);
  res.status(201).json(toLeaseResponse(lease));
}

export async function listLeasesHandler(req: Request, res: Response) {
  const parsed = listLeasesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ValidationError("Invalid query parameters", parsed.error.flatten());
  }

  const leases = await leaseService.listLeases(parsed.data);
  res.status(200).json(mapPaginated(leases, toLeaseResponse));
}

export async function getLeaseHandler(req: Request, res: Response) {
  const lease = await leaseService.getLeaseById(parseIdParam(req.params.id, "Lease"));
  res.status(200).json(toLeaseResponse(lease));
}

export async function updateLeaseHandler(req: Request, res: Response) {
  const parsed = updateLeaseSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Invalid lease payload", parsed.error.flatten());
  }

  const lease = await leaseService.updateLease(parseIdParam(req.params.id, "Lease"), parsed.data);
  res.status(200).json(toLeaseResponse(lease));
}

export async function moveOutHandler(req: Request, res: Response) {
  const parsed = moveOutSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Invalid move-out payload", parsed.error.flatten());
  }

  const lease = await leaseService.recordMoveOut(
    parseIdParam(req.params.id, "Lease"),
    parsed.data.moveOutDate,
    parsed.data.endMeterReading,
    parsed.data.overdueCharges,
  );
  res.status(200).json(toLeaseResponse(lease));
}

export async function listOccupantsHandler(req: Request, res: Response) {
  const parsed = listOccupantsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ValidationError("Invalid query parameters", parsed.error.flatten());
  }

  const occupants = await leaseService.listOccupants(
    parseIdParam(req.params.id, "Lease"),
    parsed.data,
  );
  res.status(200).json(mapPaginated(occupants, toOccupantResponse));
}

export async function addOccupantHandler(req: Request, res: Response) {
  const parsed = addOccupantSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Invalid occupant payload", parsed.error.flatten());
  }

  const occupant = await leaseService.addOccupant(parseIdParam(req.params.id, "Lease"), parsed.data);
  res.status(201).json(toOccupantResponse(occupant));
}

export async function departOccupantHandler(req: Request, res: Response) {
  const parsed = departOccupantSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Invalid departure payload", parsed.error.flatten());
  }

  const occupant = await leaseService.departOccupant(
    parseIdParam(req.params.id, "Lease"),
    parseIdParam(req.params.occupantId, "Occupant"),
    parsed.data.leftAt,
  );
  res.status(200).json(toOccupantResponse(occupant));
}

export async function transferPrimaryHandler(req: Request, res: Response) {
  const parsed = transferPrimarySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Invalid transfer payload", parsed.error.flatten());
  }

  const lease = await leaseService.transferPrimary(
    parseIdParam(req.params.id, "Lease"),
    parsed.data.customerId,
  );
  res.status(200).json(toLeaseResponse(lease));
}
