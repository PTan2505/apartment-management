import type { Request, Response } from "express";
import { UnauthorizedError, ValidationError } from "@/lib/errors.js";
import { startPaymentSchema } from "@/modules/payment-gateway/schema.js";
import {
  createReportSchema,
  reportPhotoConfirmSchema,
  reportPhotoUploadSchema,
} from "@/modules/damage-reports/schema.js";
import {
  createVisitorSchema,
  updateVisitorSchema,
  visitorIdCardConfirmSchema,
  visitorIdCardUploadSchema,
} from "@/modules/visitors/schema.js";
import { parseIdParam, RESOURCE } from "@/lib/parse-id.js";
import * as portalService from "./service.js";

/* --- the owner's half --- */

export async function getLeasePortalLinkHandler(req: Request, res: Response) {
  const leaseId = parseIdParam(req.params.id, RESOURCE.lease);
  res.status(200).json(await portalService.getLeasePortalLink(leaseId));
}

export async function reissueLeasePortalLinkHandler(req: Request, res: Response) {
  const leaseId = parseIdParam(req.params.id, RESOURCE.lease);
  res.status(201).json(await portalService.reissueLeasePortalLink(leaseId));
}

export async function revokeLeasePortalLinkHandler(req: Request, res: Response) {
  const leaseId = parseIdParam(req.params.id, RESOURCE.lease);
  res.status(200).json(await portalService.revokeLeasePortalLink(leaseId));
}

/* --- the tenant's half --- */

/**
 * The token arrives in the Authorization header, never in the URL.
 *
 * `pinoHttp` logs `req.url` on every request, so a token in the path or query
 * string is written into the log file each time it is used — undoing the reason
 * it is hashed in the database at all. The link the owner sends carries it
 * after a `#`, which a browser never transmits; the page reads it there and
 * sends it here.
 */
function readPortalToken(req: Request): string {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new UnauthorizedError("AUTH_HEADER_MISSING", "Missing or malformed Authorization header");
  }
  return header.slice("Bearer ".length);
}

export async function getPortalOverviewHandler(req: Request, res: Response) {
  res.status(200).json(await portalService.getPortalOverview(readPortalToken(req)));
}

export async function startPortalPaymentHandler(req: Request, res: Response) {
  const parsed = startPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("PAYMENT_PAYLOAD_INVALID", "Invalid payment payload", parsed.error.flatten());
  }

  const invoiceId = parseIdParam(req.params.id, RESOURCE.invoice);
  res.status(201).json(
    await portalService.startPortalPayment(readPortalToken(req), invoiceId, parsed.data),
  );
}

/* --- reporting something broken --- */

export async function raisePortalReportHandler(req: Request, res: Response) {
  const parsed = createReportSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("REPORT_PAYLOAD_INVALID", "Invalid report", parsed.error.flatten());
  }
  res
    .status(201)
    .json(await portalService.raisePortalReport(readPortalToken(req), parsed.data));
}

export async function listPortalReportsHandler(req: Request, res: Response) {
  res.status(200).json({ data: await portalService.listPortalReports(readPortalToken(req)) });
}

export async function portalReportPhotoUrlHandler(req: Request, res: Response) {
  const parsed = reportPhotoUploadSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(
      "REPORT_PHOTO_PAYLOAD_INVALID",
      "Invalid photograph request",
      parsed.error.flatten(),
    );
  }
  const reportId = parseIdParam(req.params.id, RESOURCE.damageReport);
  res
    .status(201)
    .json(await portalService.signPortalReportPhoto(readPortalToken(req), reportId, parsed.data));
}

export async function portalReportPhotoConfirmHandler(req: Request, res: Response) {
  const parsed = reportPhotoConfirmSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(
      "REPORT_PHOTO_PAYLOAD_INVALID",
      "Invalid photograph confirmation",
      parsed.error.flatten(),
    );
  }
  const reportId = parseIdParam(req.params.id, RESOURCE.damageReport);
  res
    .status(200)
    .json(await portalService.confirmPortalReportPhoto(readPortalToken(req), reportId, parsed.data));
}

/* --- registering somebody who is staying --- */

/** The side out of the path, where a download names it there rather than in a body. */
function sideParam(value: string | string[] | undefined): "front" | "back" {
  if (value === "front" || value === "back") return value;
  throw new ValidationError(
    "VISITOR_ID_CARD_SIDE_INVALID",
    "Mặt giấy tờ phải là front hoặc back",
  );
}

export async function registerPortalVisitorHandler(req: Request, res: Response) {
  const parsed = createVisitorSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(
      "VISITOR_PAYLOAD_INVALID",
      "Thông tin khách không hợp lệ",
      parsed.error.flatten(),
    );
  }
  res
    .status(201)
    .json(await portalService.registerPortalVisitor(readPortalToken(req), parsed.data));
}

export async function listPortalVisitorsHandler(req: Request, res: Response) {
  res.status(200).json({ data: await portalService.listPortalVisitors(readPortalToken(req)) });
}

export async function updatePortalVisitorHandler(req: Request, res: Response) {
  const parsed = updateVisitorSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(
      "VISITOR_PAYLOAD_INVALID",
      "Thông tin khách không hợp lệ",
      parsed.error.flatten(),
    );
  }
  const id = parseIdParam(req.params.id, RESOURCE.visitor);
  res
    .status(200)
    .json(await portalService.updatePortalVisitor(readPortalToken(req), id, parsed.data));
}

export async function cancelPortalVisitorHandler(req: Request, res: Response) {
  const id = parseIdParam(req.params.id, RESOURCE.visitor);
  res.status(200).json(await portalService.cancelPortalVisitor(readPortalToken(req), id));
}

export async function portalVisitorIdCardUrlHandler(req: Request, res: Response) {
  const parsed = visitorIdCardUploadSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(
      "VISITOR_ID_CARD_INVALID",
      "Yêu cầu tải ảnh không hợp lệ",
      parsed.error.flatten(),
    );
  }
  const id = parseIdParam(req.params.id, RESOURCE.visitor);
  res
    .status(201)
    .json(await portalService.signPortalVisitorIdCard(readPortalToken(req), id, parsed.data));
}

export async function portalVisitorIdCardConfirmHandler(req: Request, res: Response) {
  const parsed = visitorIdCardConfirmSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(
      "VISITOR_ID_CARD_INVALID",
      "Yêu cầu tải ảnh không hợp lệ",
      parsed.error.flatten(),
    );
  }
  const id = parseIdParam(req.params.id, RESOURCE.visitor);
  res
    .status(200)
    .json(await portalService.confirmPortalVisitorIdCard(readPortalToken(req), id, parsed.data));
}

export async function portalVisitorIdCardDownloadHandler(req: Request, res: Response) {
  const id = parseIdParam(req.params.id, RESOURCE.visitor);
  res.status(200).json(
    await portalService.portalVisitorIdCardDownload(
      readPortalToken(req),
      id,
      sideParam(req.params.side),
    ),
  );
}
