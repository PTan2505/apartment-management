import type { Request, Response } from "express";
import { ValidationError } from "@/lib/errors.js";
import {
  createLeaseSchema,
  updateLeaseSchema,
  moveOutSchema,
  listLeasesQuerySchema,
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
  res.status(200).json(leases.map(toLeaseResponse));
}

export async function getLeaseHandler(req: Request, res: Response) {
  const lease = await leaseService.getLeaseById(req.params.id as string);
  res.status(200).json(toLeaseResponse(lease));
}

export async function updateLeaseHandler(req: Request, res: Response) {
  const parsed = updateLeaseSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Invalid lease payload", parsed.error.flatten());
  }

  const lease = await leaseService.updateLease(req.params.id as string, parsed.data);
  res.status(200).json(toLeaseResponse(lease));
}

export async function moveOutHandler(req: Request, res: Response) {
  const parsed = moveOutSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Invalid move-out payload", parsed.error.flatten());
  }

  const lease = await leaseService.recordMoveOut(
    req.params.id as string,
    parsed.data.moveOutDate,
  );
  res.status(200).json(toLeaseResponse(lease));
}

export async function listOccupantsHandler(req: Request, res: Response) {
  const occupants = await leaseService.listOccupants(req.params.id as string);
  res.status(200).json(occupants.map(toOccupantResponse));
}

export async function addOccupantHandler(req: Request, res: Response) {
  const parsed = addOccupantSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Invalid occupant payload", parsed.error.flatten());
  }

  const occupant = await leaseService.addOccupant(req.params.id as string, parsed.data);
  res.status(201).json(toOccupantResponse(occupant));
}

export async function departOccupantHandler(req: Request, res: Response) {
  const parsed = departOccupantSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Invalid departure payload", parsed.error.flatten());
  }

  const occupant = await leaseService.departOccupant(
    req.params.id as string,
    req.params.occupantId as string,
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
    req.params.id as string,
    parsed.data.customerId,
  );
  res.status(200).json(toLeaseResponse(lease));
}
