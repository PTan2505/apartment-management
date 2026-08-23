import type { Request, Response } from "express";
import { UnauthorizedError, ValidationError } from "@/lib/errors.js";
import { startPaymentSchema } from "@/modules/payment-gateway/schema.js";
import { parseIdParam } from "@/lib/parse-id.js";
import * as portalService from "./service.js";

/* --- the owner's half --- */

export async function issuePortalLinkHandler(req: Request, res: Response) {
  const customerId = parseIdParam(req.params.id, "Customer");
  res.status(201).json(await portalService.issuePortalLink(customerId));
}

export async function revokePortalLinkHandler(req: Request, res: Response) {
  const customerId = parseIdParam(req.params.id, "Customer");
  res.status(200).json(await portalService.revokePortalLink(customerId));
}

export async function getPortalLinkStatusHandler(req: Request, res: Response) {
  const customerId = parseIdParam(req.params.id, "Customer");
  res.status(200).json(await portalService.getPortalLinkStatus(customerId));
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
    throw new UnauthorizedError("Missing or malformed Authorization header");
  }
  return header.slice("Bearer ".length);
}

export async function getPortalOverviewHandler(req: Request, res: Response) {
  res.status(200).json(await portalService.getPortalOverview(readPortalToken(req)));
}

export async function startPortalPaymentHandler(req: Request, res: Response) {
  const parsed = startPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Invalid payment payload", parsed.error.flatten());
  }

  const invoiceId = parseIdParam(req.params.id, "Invoice");
  res.status(201).json(
    await portalService.startPortalPayment(readPortalToken(req), invoiceId, parsed.data),
  );
}
