import { Router } from "express";

import { authenticate } from "@/middleware/authenticate.js";
import { requireRole } from "@/middleware/require-role.js";
import { accountGuard } from "@/middleware/staff-scope.js";
import {
  getResidenceFormHandler,
  residenceFormConfirmHandler,
  residenceFormDownloadHandler,
  residenceFormRemoveHandler,
  residenceFormUploadUrlHandler,
} from "./controller.js";

/**
 * The blank residence form, one per system.
 *
 * Replacing it is the business changing the paper it puts in front of the
 * authorities, which stays with the owner. A manager may READ it, because a
 * manager files this paperwork too — the same split the blank contract already
 * has.
 */
export const residenceFormRouter = Router();

residenceFormRouter.use(authenticate, accountGuard);

residenceFormRouter.get("/", requireRole("owner", "manager"), getResidenceFormHandler);
residenceFormRouter.post("/upload-url", requireRole("owner"), residenceFormUploadUrlHandler);
residenceFormRouter.post("/", requireRole("owner"), residenceFormConfirmHandler);
residenceFormRouter.get(
  "/download",
  requireRole("owner", "manager"),
  residenceFormDownloadHandler,
);
residenceFormRouter.delete("/", requireRole("owner"), residenceFormRemoveHandler);
