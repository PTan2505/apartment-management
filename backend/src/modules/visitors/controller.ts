import type { Request, Response } from "express";

import { ValidationError } from "@/lib/errors.js";
import { parseIdParam, RESOURCE } from "@/lib/parse-id.js";
import { scopeOf } from "@/middleware/staff-scope.js";
import { ID_CARD_SIDES } from "@/lib/storage.js";
import {
  createVisitorSchema,
  listVisitorsQuerySchema,
  updateVisitorSchema,
  visitorIdCardConfirmSchema,
  visitorIdCardUploadSchema,
} from "./schema.js";
import * as visitorService from "./service.js";

/** The side out of the path, where a download names it there rather than in a body. */
function sideParam(value: string | string[] | undefined): "front" | "back" {
  if (value === "front" || value === "back") return value;
  throw new ValidationError(
    "VISITOR_ID_CARD_SIDE_INVALID",
    `Mặt giấy tờ phải là một trong: ${ID_CARD_SIDES.join(", ")}`,
  );
}

export async function listVisitorsHandler(req: Request, res: Response) {
  const parsed = listVisitorsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ValidationError("QUERY_INVALID", "Invalid query parameters", parsed.error.flatten());
  }
  res.status(200).json(await visitorService.listVisitors(parsed.data, scopeOf(req)));
}

export async function listLeaseVisitorsHandler(req: Request, res: Response) {
  const leaseId = parseIdParam(req.params.id, RESOURCE.lease);
  // Reached through the leases router, whose `router.param` has already refused
  // a tenancy outside this account's buildings.
  res.status(200).json({ data: await visitorService.listVisitorsForLease(leaseId) });
}

/**
 * Staff registering somebody.
 *
 * `addedByStaff` is set HERE rather than taken from the body: it records which
 * door the registration came through, and a fact about the request is not
 * something the request gets to assert.
 */
export async function createLeaseVisitorHandler(req: Request, res: Response) {
  const leaseId = parseIdParam(req.params.id, RESOURCE.lease);
  const parsed = createVisitorSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("VISITOR_PAYLOAD_INVALID", "Thông tin khách không hợp lệ", parsed.error.flatten());
  }
  res.status(201).json(await visitorService.createVisitor(leaseId, parsed.data, true));
}

export async function getVisitorHandler(req: Request, res: Response) {
  const id = parseIdParam(req.params.id, RESOURCE.visitor);
  res.status(200).json(await visitorService.getVisitorById(id, { scope: scopeOf(req) }));
}

export async function updateVisitorHandler(req: Request, res: Response) {
  const id = parseIdParam(req.params.id, RESOURCE.visitor);
  const parsed = updateVisitorSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("VISITOR_PAYLOAD_INVALID", "Thông tin khách không hợp lệ", parsed.error.flatten());
  }
  res.status(200).json(await visitorService.updateVisitor(id, parsed.data, { scope: scopeOf(req) }));
}

export async function cancelVisitorHandler(req: Request, res: Response) {
  const id = parseIdParam(req.params.id, RESOURCE.visitor);
  res.status(200).json(await visitorService.cancelVisitor(id, { scope: scopeOf(req) }));
}

export async function visitorIdCardUrlHandler(req: Request, res: Response) {
  const id = parseIdParam(req.params.id, RESOURCE.visitor);
  const parsed = visitorIdCardUploadSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("VISITOR_ID_CARD_INVALID", "Yêu cầu tải ảnh không hợp lệ", parsed.error.flatten());
  }
  res.status(201).json(await visitorService.signIdCardUpload(id, parsed.data, { scope: scopeOf(req) }));
}

export async function visitorIdCardConfirmHandler(req: Request, res: Response) {
  const id = parseIdParam(req.params.id, RESOURCE.visitor);
  const parsed = visitorIdCardConfirmSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("VISITOR_ID_CARD_INVALID", "Yêu cầu tải ảnh không hợp lệ", parsed.error.flatten());
  }
  res.status(200).json(await visitorService.confirmIdCard(id, parsed.data, { scope: scopeOf(req) }));
}

export async function visitorIdCardDownloadHandler(req: Request, res: Response) {
  const id = parseIdParam(req.params.id, RESOURCE.visitor);
  const side = sideParam(req.params.side);
  res.status(200).json(await visitorService.idCardDownload(id, side, { scope: scopeOf(req) }));
}
