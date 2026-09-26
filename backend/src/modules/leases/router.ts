import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.js";
import { leaseServiceFeesRouter } from "@/modules/service-fees/router.js";
import {
  adjustDepositHandler,
  getSettlementHandler,
  refundDepositHandler,
} from "@/modules/deposits/controller.js";
import {
  getLeasePortalLinkHandler,
  reissueLeasePortalLinkHandler,
  revokeLeasePortalLinkHandler,
} from "@/modules/tenant-portal/controller.js";
import { accountGuard, requireParamInScope } from "@/middleware/staff-scope.js";
import { leaseBuildingId } from "@/lib/scope-lookup.js";
import { RESOURCE } from "@/lib/parse-id.js";
import { requireRole } from "@/middleware/require-role.js";
import {
  createLeaseHandler,
  listLeasesHandler,
  getLeaseHandler,
  updateLeaseHandler,
  moveOutHandler,
  cancelLeaseHandler,
  contractUploadUrlHandler,
  contractConfirmHandler,
  contractPagesHandler,
  contractPageRemoveHandler,
  extendLeaseHandler,
  listOccupantsHandler,
  addOccupantHandler,
  departOccupantHandler,
  transferPrimaryHandler,
} from "./controller.js";

export const leasesRouter = Router();

leasesRouter.use(authenticate, accountGuard, requireRole("owner", "manager"));

/*
  Every route below that names a tenancy by id — and every router mounted under
  one, occupants and service fees among them — is checked against the caller's
  buildings here, once. A tenancy in a building they do not cover reads as
  absent.
*/
leasesRouter.param("id", requireParamInScope(RESOURCE.lease, leaseBuildingId));

leasesRouter.post("/", createLeaseHandler);
leasesRouter.get("/", listLeasesHandler);
leasesRouter.get("/:id", getLeaseHandler);
/*
  Correcting the terms of a signed tenancy is the owner's.

  This is the one route here that a manager loses, and the occupant count goes
  with it — the same endpoint carries both, and the count decides the water
  bill. A manager signs tenancies and closes them; what a signed one SAYS is
  not theirs to revise afterwards.
*/
leasesRouter.patch("/:id", requireRole("owner"), updateLeaseHandler);
leasesRouter.post("/:id/move-out", moveOutHandler);
// Recording that a tenancy never took place. A different event from a move-out
// and deliberately a different endpoint: the two take different inputs, refuse
// on different grounds, and mean different things about the room's history.
leasesRouter.post("/:id/cancel", cancelLeaseHandler);
// Renewing: closes this lease at its agreed end date and opens a successor
// beginning the same day, carrying the deposit rather than charging it again.
leasesRouter.post("/:id/extend", extendLeaseHandler);

// The deposit held against this tenancy. Handlers live in the deposits module;
// they hang here because they act on one lease.
leasesRouter.get("/:id/deposit-settlement", getSettlementHandler);
leasesRouter.post("/:id/deposit-refund", refundDepositHandler);
leasesRouter.post("/:id/deposit-adjustment", adjustDepositHandler);

// The signed contract. Three steps deliberately: the API signs a URL, the
// BROWSER uploads to storage, and only then does the API record it — a scan is
// megabytes and this process has nothing to do with the bytes.
leasesRouter.post("/:id/contract-upload-url", contractUploadUrlHandler);
leasesRouter.post("/:id/contract", contractConfirmHandler);
leasesRouter.get("/:id/contract", contractPagesHandler);
leasesRouter.delete("/:id/contract/:pageId", contractPageRemoveHandler);

leasesRouter.get("/:id/occupants", listOccupantsHandler);
leasesRouter.post("/:id/occupants", addOccupantHandler);
leasesRouter.post("/:id/occupants/:occupantId/depart", departOccupantHandler);
leasesRouter.post("/:id/occupants/transfer-primary", transferPrimaryHandler);

// Which of the building's service fees this lease agreed to.
leasesRouter.use("/:id/service-fees", leaseServiceFeesRouter);

/*
  The link this tenancy is paid through. Handlers live in the tenant-portal
  module; they hang here because they act on one tenancy.

  GET returns the token itself, not merely its existence: an owner sending the
  link a second time must not have to replace it, which would kill the copy the
  tenant already has.
*/
leasesRouter.get("/:id/portal-link", getLeasePortalLinkHandler);
leasesRouter.post("/:id/portal-link", reissueLeasePortalLinkHandler);
leasesRouter.delete("/:id/portal-link", revokeLeasePortalLinkHandler);
