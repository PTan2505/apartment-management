import { Router } from "express";
import {
  createServiceFeeHandler,
  listServiceFeesHandler,
  updateServiceFeeHandler,
  retireServiceFeeHandler,
  restoreServiceFeeHandler,
  listLeaseServiceFeesHandler,
  selectServiceFeeHandler,
  updateLeaseServiceFeeHandler,
  removeLeaseServiceFeeHandler,
} from "./controller.js";

/**
 * Two routers, because a service fee is reached from two places: a building
 * defines what it charges for, and a lease says which of those it agreed to.
 *
 * Both use `mergeParams` so the parent's id is visible here. They are mounted
 * by the buildings and leases routers rather than at the top level, which keeps
 * the handlers in this module instead of scattering them into those routers.
 *
 * Authentication is not repeated: both parents already apply it before mounting.
 */

/** Mounted by the buildings router at `/:buildingId/service-fees`. */
export const buildingServiceFeesRouter = Router({ mergeParams: true });

buildingServiceFeesRouter.post("/", createServiceFeeHandler);
buildingServiceFeesRouter.get("/", listServiceFeesHandler);
buildingServiceFeesRouter.patch("/:feeId", updateServiceFeeHandler);
buildingServiceFeesRouter.post("/:feeId/retire", retireServiceFeeHandler);
buildingServiceFeesRouter.post("/:feeId/restore", restoreServiceFeeHandler);

/** Mounted by the leases router at `/:id/service-fees`. */
export const leaseServiceFeesRouter = Router({ mergeParams: true });

leaseServiceFeesRouter.get("/", listLeaseServiceFeesHandler);
leaseServiceFeesRouter.post("/", selectServiceFeeHandler);
leaseServiceFeesRouter.patch("/:selectionId", updateLeaseServiceFeeHandler);
leaseServiceFeesRouter.delete("/:selectionId", removeLeaseServiceFeeHandler);
