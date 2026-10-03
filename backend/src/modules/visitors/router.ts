import { Router } from "express";

import { authenticate } from "@/middleware/authenticate.js";
import { requireRole } from "@/middleware/require-role.js";
import { accountGuard } from "@/middleware/staff-scope.js";
import {
  cancelVisitorHandler,
  getVisitorHandler,
  listVisitorsHandler,
  updateVisitorHandler,
  visitorIdCardConfirmHandler,
  visitorIdCardDownloadHandler,
  visitorIdCardUrlHandler,
} from "./controller.js";

/**
 * Who is staying in the buildings, besides the people on the tenancies.
 *
 * `maintenance` is refused outright. The repair rounds do not need to know who
 * somebody's cousin is, and this router holds dates of birth, home addresses
 * and photographs of identity documents belonging to people with no
 * relationship to the business at all.
 *
 * No `router.param` guard: a registration reaches its building through a
 * tenancy and a room, and the service answers NOT FOUND outside the caller's
 * scope. One check, where the record is loaded.
 */
export const visitorsRouter = Router();

visitorsRouter.use(authenticate, accountGuard, requireRole("owner", "manager"));

visitorsRouter.get("/", listVisitorsHandler);
visitorsRouter.get("/:id", getVisitorHandler);
visitorsRouter.patch("/:id", updateVisitorHandler);
visitorsRouter.post("/:id/cancel", cancelVisitorHandler);

// Three steps like every other file in this system: the API signs a URL, the
// browser uploads straight to storage, the API confirms the object arrived.
visitorsRouter.post("/:id/id-card-url", visitorIdCardUrlHandler);
visitorsRouter.post("/:id/id-card", visitorIdCardConfirmHandler);
visitorsRouter.get("/:id/id-card/:side/download", visitorIdCardDownloadHandler);
