import { Router } from "express";
import {
  cancelPortalVisitorHandler,
  listPortalVisitorsHandler,
  portalVisitorIdCardConfirmHandler,
  portalVisitorIdCardDownloadHandler,
  portalVisitorIdCardUrlHandler,
  registerPortalVisitorHandler,
  updatePortalVisitorHandler,
  getPortalOverviewHandler,
  listPortalReportsHandler,
  portalReportPhotoConfirmHandler,
  portalReportPhotoUrlHandler,
  raisePortalReportHandler,
  startPortalPaymentHandler,
} from "./controller.js";

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

/*
  Reporting something broken, and following what became of it.

  Authorised by the same link the bills are: the tenancy is taken from the
  token, so nothing here asks a tenant where they live.
*/
tenantPortalRouter.get("/reports", listPortalReportsHandler);
tenantPortalRouter.post("/reports", raisePortalReportHandler);
tenantPortalRouter.post("/reports/:id/photo-url", portalReportPhotoUrlHandler);
tenantPortalRouter.post("/reports/:id/photos", portalReportPhotoConfirmHandler);

/*
  Registering somebody who is staying.

  The portal's second write, authorised by the same token and reaching no
  further: the tenancy comes from the token, so nothing here asks a tenant
  where they live, and every handler re-checks that the registration it was
  handed belongs to that tenancy.

  There is no route here for producing the residence form. The filing carries
  the signatory's identity number and every co-arriving visitor's details,
  which is more reach than registering one guest was meant to grant — it stays
  with staff.
*/
tenantPortalRouter.get("/visitors", listPortalVisitorsHandler);
tenantPortalRouter.post("/visitors", registerPortalVisitorHandler);
tenantPortalRouter.patch("/visitors/:id", updatePortalVisitorHandler);
tenantPortalRouter.post("/visitors/:id/cancel", cancelPortalVisitorHandler);
tenantPortalRouter.post("/visitors/:id/id-card-url", portalVisitorIdCardUrlHandler);
tenantPortalRouter.post("/visitors/:id/id-card", portalVisitorIdCardConfirmHandler);
tenantPortalRouter.get(
  "/visitors/:id/id-card/:side/download",
  portalVisitorIdCardDownloadHandler,
);
