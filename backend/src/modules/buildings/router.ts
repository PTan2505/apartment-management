import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.js";
import { requireRole } from "@/middleware/require-role.js";
import {
  createBuildingHandler,
  listBuildingsHandler,
  listBuildingLocationsHandler,
  getBuildingHandler,
  updateBuildingHandler,
  retireBuildingHandler,
  restoreBuildingHandler,
} from "./controller.js";

export const buildingsRouter = Router();

buildingsRouter.use(authenticate, requireRole("owner"));

buildingsRouter.post("/", createBuildingHandler);
buildingsRouter.get("/", listBuildingsHandler);
// Must stay above "/:id": Express matches in registration order, so declaring
// it after would let the id route capture "locations" as an id.
buildingsRouter.get("/locations", listBuildingLocationsHandler);
buildingsRouter.get("/:id", getBuildingHandler);
buildingsRouter.patch("/:id", updateBuildingHandler);
buildingsRouter.post("/:id/retire", retireBuildingHandler);
buildingsRouter.post("/:id/restore", restoreBuildingHandler);
