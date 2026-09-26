import { Router } from "express";
import { requireRole } from "@/middleware/require-role.js";
import {
  createServiceFeeHandler,
  listServiceFeesHandler,
  updateServiceFeeHandler,
  retireServiceFeeHandler,
  restoreServiceFeeHandler,
  listLeaseServiceFeesHandler,
  selectServiceFeeHandler,
  updateLeaseServiceFeeHandler,
  endLeaseServiceFeeHandler,
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
 *
 * Roles differ between the two. What a BUILDING charges for is the owner's to
 * set; which of those a TENANCY agreed to is part of signing it, which a
 * manager does.
 */

/** Mounted by the buildings router at `/:buildingId/service-fees`. */
export const buildingServiceFeesRouter = Router({ mergeParams: true });

buildingServiceFeesRouter.post("/", requireRole("owner"), createServiceFeeHandler);
buildingServiceFeesRouter.get("/", requireRole("owner", "manager"), listServiceFeesHandler);
buildingServiceFeesRouter.patch("/:feeId", requireRole("owner"), updateServiceFeeHandler);
buildingServiceFeesRouter.post("/:feeId/retire", requireRole("owner"), retireServiceFeeHandler);
buildingServiceFeesRouter.post("/:feeId/restore", requireRole("owner"), restoreServiceFeeHandler);

/** Mounted by the leases router at `/:id/service-fees`. */
export const leaseServiceFeesRouter = Router({ mergeParams: true });

leaseServiceFeesRouter.get("/", listLeaseServiceFeesHandler);
leaseServiceFeesRouter.post("/", selectServiceFeeHandler);
leaseServiceFeesRouter.patch("/:selectionId", updateLeaseServiceFeeHandler);
// DELETE still expresses "this lease no longer has that fee" — but it records
// the date rather than erasing the record, so it answers 200 with the period.
leaseServiceFeesRouter.delete("/:selectionId", endLeaseServiceFeeHandler);
