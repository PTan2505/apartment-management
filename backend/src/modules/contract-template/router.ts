import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.js";
import { accountGuard } from "@/middleware/staff-scope.js";
import { requireRole } from "@/middleware/require-role.js";
import {
  getTemplateHandler,
  templateConfirmHandler,
  templateDownloadHandler,
  templateRemoveHandler,
  templateUploadUrlHandler,
} from "./controller.js";

export const contractTemplateRouter = Router();

/*
  The blank contract: a manager signing a tenancy needs to print it, so they
  read it. Replacing it is the business changing the paper it puts in front of
  tenants, which stays with the owner.
*/
contractTemplateRouter.use(authenticate, accountGuard);

// Three steps like every other file in this system: the API signs a URL, the
// browser uploads straight to storage, the API confirms the object arrived.
contractTemplateRouter.get("/", requireRole("owner", "manager"), getTemplateHandler);
contractTemplateRouter.post("/upload-url", requireRole("owner"), templateUploadUrlHandler);
contractTemplateRouter.post("/", requireRole("owner"), templateConfirmHandler);
contractTemplateRouter.get("/download", requireRole("owner", "manager"), templateDownloadHandler);
contractTemplateRouter.delete("/", requireRole("owner"), templateRemoveHandler);
