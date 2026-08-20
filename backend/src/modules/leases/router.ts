import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.js";
import { leaseServiceFeesRouter } from "@/modules/service-fees/router.js";
import { requireRole } from "@/middleware/require-role.js";
import {
  createLeaseHandler,
  listLeasesHandler,
  getLeaseHandler,
  updateLeaseHandler,
  moveOutHandler,
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

leasesRouter.get("/:id/occupants", listOccupantsHandler);
leasesRouter.post("/:id/occupants", addOccupantHandler);
leasesRouter.post("/:id/occupants/:occupantId/depart", departOccupantHandler);
leasesRouter.post("/:id/occupants/transfer-primary", transferPrimaryHandler);

// Which of the building's service fees this lease agreed to.
leasesRouter.use("/:id/service-fees", leaseServiceFeesRouter);
