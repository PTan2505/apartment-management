import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.js";
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
