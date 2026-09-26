import type { Request, Response } from "express";
import { UnauthorizedError, ValidationError } from "@/lib/errors.js";
import { startPaymentSchema } from "@/modules/payment-gateway/schema.js";
import {
  createReportSchema,
  reportPhotoConfirmSchema,
  reportPhotoUploadSchema,
} from "@/modules/damage-reports/schema.js";
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
