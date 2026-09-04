import type { Request, Response } from "express";
import { ValidationError } from "@/lib/errors.js";
import { parseIdParam, RESOURCE } from "@/lib/parse-id.js";
import { mapPaginated } from "@/lib/pagination.js";
import {
  createLeaseSchema,
  updateLeaseSchema,
  moveOutSchema,
  cancelLeaseSchema,
  contractUploadSchema,
  contractConfirmSchema,
  extendLeaseSchema,
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
    throw new ValidationError("LEASE_PAYLOAD_INVALID", "Invalid lease payload", parsed.error.flatten());
  }

  const lease = await leaseService.createLease(parsed.data);
  res.status(201).json(toLeaseResponse(lease));
}

export async function listLeasesHandler(req: Request, res: Response) {
  const parsed = listLeasesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ValidationError("QUERY_INVALID", "Invalid query parameters", parsed.error.flatten());
  }

  const leases = await leaseService.listLeases(parsed.data);
  res.status(200).json(mapPaginated(leases, toLeaseResponse));
}

export async function getLeaseHandler(req: Request, res: Response) {
  const lease = await leaseService.getLeaseById(parseIdParam(req.params.id, RESOURCE.lease));
  res.status(200).json(toLeaseResponse(lease));
}

export async function updateLeaseHandler(req: Request, res: Response) {
  const parsed = updateLeaseSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("LEASE_PAYLOAD_INVALID", "Invalid lease payload", parsed.error.flatten());
  }

  const lease = await leaseService.updateLease(parseIdParam(req.params.id, RESOURCE.lease), parsed.data);
  res.status(200).json(toLeaseResponse(lease));
}

export async function moveOutHandler(req: Request, res: Response) {
  const parsed = moveOutSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("LEASE_MOVE_OUT_PAYLOAD_INVALID", "Invalid move-out payload", parsed.error.flatten());
  }

  const lease = await leaseService.recordMoveOut(
    parseIdParam(req.params.id, RESOURCE.lease),
    parsed.data.moveOutDate,
    parsed.data.endMeterReading,
    parsed.data.overdueCharges,
  );
  res.status(200).json(toLeaseResponse(lease));
}

export async function cancelLeaseHandler(req: Request, res: Response) {
  const parsed = cancelLeaseSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new ValidationError("LEASE_CANCEL_PAYLOAD_INVALID", "Invalid cancellation payload", parsed.error.flatten());
  }

  const lease = await leaseService.cancelLease(
    parseIdParam(req.params.id, RESOURCE.lease),
    parsed.data,
  );
  res.status(200).json(toLeaseResponse(lease));
}

export async function contractUploadUrlHandler(req: Request, res: Response) {
  const parsed = contractUploadSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new ValidationError("CONTRACT_UPLOAD_PAYLOAD_INVALID", "Invalid contract upload request", parsed.error.flatten());
  }

  const signed = await leaseService.signContractUpload(
    parseIdParam(req.params.id, RESOURCE.lease),
    parsed.data.contentType,
  );
  res.status(200).json(signed);
}

export async function contractConfirmHandler(req: Request, res: Response) {
  const parsed = contractConfirmSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new ValidationError("CONTRACT_CONFIRM_PAYLOAD_INVALID", "Invalid confirmation", parsed.error.flatten());
  }

  const lease = await leaseService.confirmContractUpload(
    parseIdParam(req.params.id, RESOURCE.lease),
    parsed.data.key,
  );
  res.status(200).json(toLeaseResponse(lease));
}

export async function contractDownloadHandler(req: Request, res: Response) {
  const signed = await leaseService.getContractDownload(parseIdParam(req.params.id, RESOURCE.lease));
  res.status(200).json(signed);
}

export async function contractRemoveHandler(req: Request, res: Response) {
  const lease = await leaseService.removeContract(parseIdParam(req.params.id, RESOURCE.lease));
  res.status(200).json(toLeaseResponse(lease));
}

export async function listOccupantsHandler(req: Request, res: Response) {
  const parsed = listOccupantsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ValidationError("QUERY_INVALID", "Invalid query parameters", parsed.error.flatten());
  }

  const occupants = await leaseService.listOccupants(
    parseIdParam(req.params.id, RESOURCE.lease),
    parsed.data,
  );
  res.status(200).json(mapPaginated(occupants, toOccupantResponse));
}

export async function addOccupantHandler(req: Request, res: Response) {
  const parsed = addOccupantSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("OCCUPANT_PAYLOAD_INVALID", "Invalid occupant payload", parsed.error.flatten());
  }

  const occupant = await leaseService.addOccupant(parseIdParam(req.params.id, RESOURCE.lease), parsed.data);
  res.status(201).json(toOccupantResponse(occupant));
}

export async function departOccupantHandler(req: Request, res: Response) {
  const parsed = departOccupantSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("OCCUPANT_DEPARTURE_PAYLOAD_INVALID", "Invalid departure payload", parsed.error.flatten());
  }

  const occupant = await leaseService.departOccupant(
    parseIdParam(req.params.id, RESOURCE.lease),
    parseIdParam(req.params.occupantId, RESOURCE.occupant),
    parsed.data.leftAt,
  );
  res.status(200).json(toOccupantResponse(occupant));
}

export async function transferPrimaryHandler(req: Request, res: Response) {
  const parsed = transferPrimarySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("OCCUPANT_TRANSFER_PAYLOAD_INVALID", "Invalid transfer payload", parsed.error.flatten());
  }

  const lease = await leaseService.transferPrimary(
    parseIdParam(req.params.id, RESOURCE.lease),
    parsed.data.customerId,
  );
  res.status(200).json(toLeaseResponse(lease));
}

export async function extendLeaseHandler(req: Request, res: Response) {
  const parsed = extendLeaseSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("LEASE_EXTENSION_PAYLOAD_INVALID", "Invalid extension payload", parsed.error.flatten());
  }

  // Both leases are returned: the renewal is one operation on two tenancies,
  // and a caller that only saw the successor could not tell what closing the
  // predecessor did to its deposit.
  const { previous, lease } = await leaseService.extendLease(
    parseIdParam(req.params.id, RESOURCE.lease),
    parsed.data,
  );
  res.status(201).json({
    previous: toLeaseResponse(previous),
    lease: toLeaseResponse(lease),
  });
}
