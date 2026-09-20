import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.js";
import { requireRole } from "@/middleware/require-role.js";
import {
  getTemplateHandler,
  templateConfirmHandler,
  templateDownloadHandler,
  templateRemoveHandler,
  templateUploadUrlHandler,
} from "./controller.js";

export const contractTemplateRouter = Router();

contractTemplateRouter.use(authenticate, requireRole("owner"));

// Three steps like every other file in this system: the API signs a URL, the
// browser uploads straight to storage, the API confirms the object arrived.
contractTemplateRouter.get("/", getTemplateHandler);
contractTemplateRouter.post("/upload-url", templateUploadUrlHandler);
contractTemplateRouter.post("/", templateConfirmHandler);
contractTemplateRouter.get("/download", templateDownloadHandler);
contractTemplateRouter.delete("/", templateRemoveHandler);
