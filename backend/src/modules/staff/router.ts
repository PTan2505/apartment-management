import { Router } from "express";

import { authenticate } from "@/middleware/authenticate.js";
import { requireRole } from "@/middleware/require-role.js";
import { accountGuard } from "@/middleware/staff-scope.js";
import {
  assignBuildingsHandler,
  createStaffHandler,
  deactivateStaffHandler,
  getStaffHandler,
  listStaffHandler,
  resetStaffPasswordHandler,
  restoreStaffHandler,
  updateStaffHandler,
} from "./controller.js";

/**
 * Accounts, and the buildings they cover. Owner only, throughout: a manager
 * running a building is not thereby running who else works there.
 */
export const staffRouter = Router();

staffRouter.use(authenticate, accountGuard, requireRole("owner"));

staffRouter.post("/", createStaffHandler);
staffRouter.get("/", listStaffHandler);
staffRouter.get("/:id", getStaffHandler);
staffRouter.patch("/:id", updateStaffHandler);
// The whole set, not an addition — see the service for why.
staffRouter.put("/:id/buildings", assignBuildingsHandler);
// Answers with a new password, once, exactly as creating an account does.
staffRouter.post("/:id/password-reset", resetStaffPasswordHandler);
staffRouter.post("/:id/deactivate", deactivateStaffHandler);
staffRouter.post("/:id/restore", restoreStaffHandler);
