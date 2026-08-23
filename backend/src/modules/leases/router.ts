import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.js";
import { leaseServiceFeesRouter } from "@/modules/service-fees/router.js";
import {
  adjustDepositHandler,
  getSettlementHandler,
  refundDepositHandler,
} from "@/modules/deposits/controller.js";
import { requireRole } from "@/middleware/require-role.js";
import {
  createLeaseHandler,
  listLeasesHandler,
  getLeaseHandler,
  updateLeaseHandler,
  moveOutHandler,
  extendLeaseHandler,
  listOccupantsHandler,
  addOccupantHandler,
  departOccupantHandler,
  transferPrimaryHandler,
} from "./controller.js";

export const leasesRouter = Router();

leasesRouter.use(authenticate, requireRole("owner"));

leasesRouter.post("/", createLeaseHandler);
leasesRouter.get("/", listLeasesHandler);
leasesRouter.get("/:id", getLeaseHandler);
leasesRouter.patch("/:id", updateLeaseHandler);
leasesRouter.post("/:id/move-out", moveOutHandler);
// Renewing: closes this lease at its agreed end date and opens a successor
// beginning the same day, carrying the deposit rather than charging it again.
leasesRouter.post("/:id/extend", extendLeaseHandler);

// The deposit held against this tenancy. Handlers live in the deposits module;
// they hang here because they act on one lease.
leasesRouter.get("/:id/deposit-settlement", getSettlementHandler);
leasesRouter.post("/:id/deposit-refund", refundDepositHandler);
leasesRouter.post("/:id/deposit-adjustment", adjustDepositHandler);

leasesRouter.get("/:id/occupants", listOccupantsHandler);
leasesRouter.post("/:id/occupants", addOccupantHandler);
leasesRouter.post("/:id/occupants/:occupantId/depart", departOccupantHandler);
leasesRouter.post("/:id/occupants/transfer-primary", transferPrimaryHandler);

// Which of the building's service fees this lease agreed to.
leasesRouter.use("/:id/service-fees", leaseServiceFeesRouter);
