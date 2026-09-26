import { Router } from "express";

import { authenticate } from "@/middleware/authenticate.js";
import { requireRole } from "@/middleware/require-role.js";
import { accountGuard } from "@/middleware/staff-scope.js";
import {
  closeReportHandler,
  listNoticesHandler,
  markNoticesReadHandler,
  unreadNoticeCountHandler,
  getReportHandler,
  listReportsHandler,
  reportPhotoDownloadHandler,
  scheduleReportHandler,
} from "./controller.js";

/**
 * What needs fixing, for the people who fix it.
 *
 * The one place a `maintenance` account is admitted — everything else in the
 * system refuses that role. A manager is here too, because the owner decided
 * either of them may be the one who rings the tenant.
 *
 * No `router.param` guard: a report reaches its building through a tenancy and
 * a room, and the service already answers NOT FOUND outside the caller's
 * scope. One check, where the record is loaded.
 */
export const damageReportsRouter = Router();

damageReportsRouter.use(
  authenticate,
  accountGuard,
  requireRole("owner", "manager", "maintenance"),
);

/*
  Notices, above "/:id" so the literal paths are not captured as ids.

  They are the account's own — every one of these reads or writes rows keyed to
  the caller, and none of them takes an id from the request.
*/
damageReportsRouter.get("/notices", listNoticesHandler);
damageReportsRouter.get("/notices/unread-count", unreadNoticeCountHandler);
damageReportsRouter.post("/notices/read", markNoticesReadHandler);

damageReportsRouter.get("/", listReportsHandler);
damageReportsRouter.get("/:id", getReportHandler);
damageReportsRouter.post("/:id/schedule", scheduleReportHandler);
damageReportsRouter.post("/:id/close", closeReportHandler);
damageReportsRouter.get("/:id/photos/:photoId/download", reportPhotoDownloadHandler);
