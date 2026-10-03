import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.js";
import { buildingServiceFeesRouter } from "@/modules/service-fees/router.js";
import { buildingFurnitureRouter } from "@/modules/furniture/router.js";
import { accountGuard } from "@/middleware/staff-scope.js";
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

/*
  Staff read buildings; only the owner changes them.

  A manager needs the name of the building they are standing in — every screen
  they use names it — but what a building CHARGES is the business deciding what
  it sells. Running a building is carrying that out, not setting it.
*/
buildingsRouter.use(authenticate, accountGuard);

buildingsRouter.post("/", requireRole("owner"), createBuildingHandler);
buildingsRouter.get("/", requireRole("owner", "manager"), listBuildingsHandler);
// Must stay above "/:id": Express matches in registration order, so declaring
// it after would let the id route capture "locations" as an id.
buildingsRouter.get("/locations", requireRole("owner"), listBuildingLocationsHandler);
buildingsRouter.get("/:id", requireRole("owner", "manager"), getBuildingHandler);
buildingsRouter.patch("/:id", requireRole("owner"), updateBuildingHandler);
buildingsRouter.post("/:id/retire", requireRole("owner"), retireBuildingHandler);
buildingsRouter.post("/:id/restore", requireRole("owner"), restoreBuildingHandler);

// A building's service fees. Two segments deep, so this cannot be captured by
// the single-segment "/:id" routes above.
buildingsRouter.use("/:buildingId/service-fees", buildingServiceFeesRouter);

/*
  The furniture this building supplies. Beside the fee catalogue above and
  easily confused with it, so each says what it does: a service fee is charged
  every month, a furniture entry is handed over once and furnishes nobody until
  a room holds it.
*/
buildingsRouter.use("/:buildingId/furniture", buildingFurnitureRouter);
