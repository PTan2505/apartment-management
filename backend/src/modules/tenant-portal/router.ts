import { Router } from "express";
import { getPortalOverviewHandler, startPortalPaymentHandler } from "./controller.js";

/**
 * The system's first PUBLIC router. Deliberately no `authenticate`, no
 * `requireRole` — a portal token is not an access token and grants nothing an
 * owner's token grants.
 *
 * Mounted separately in server.ts, beside the guarded routers but not among
 * them, so that neither this one accidentally inherits their guard nor they
 * accidentally lose it.
 */
export const tenantPortalRouter = Router();

tenantPortalRouter.get("/", getPortalOverviewHandler);
// The portal's first write. Still authorised by the same token, and restricted
// to the same bills it can already see.
tenantPortalRouter.post("/invoices/:id/pay", startPortalPaymentHandler);
