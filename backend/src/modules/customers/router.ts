import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.js";
import { accountGuard } from "@/middleware/staff-scope.js";
import { requireRole } from "@/middleware/require-role.js";
import {
  idCardConfirmHandler,
  idCardDownloadHandler,
  idCardRemoveHandler,
  idCardUploadUrlHandler,
  registerCustomerHandler,
  listCustomersHandler,
  getCustomerHandler,
  updateCustomerHandler,
} from "./controller.js";

export const customersRouter = Router();

customersRouter.use(authenticate, accountGuard, requireRole("owner", "manager"));

customersRouter.post("/", registerCustomerHandler);
customersRouter.get("/", listCustomersHandler);
customersRouter.get("/:id", getCustomerHandler);
customersRouter.patch("/:id", updateCustomerHandler);

// The tenant's ID card. Three steps like the tenancy contract: the API signs a
// URL, the browser uploads straight to storage, the API records the result.
customersRouter.post("/:id/id-card-upload-url", idCardUploadUrlHandler);
customersRouter.post("/:id/id-card", idCardConfirmHandler);
customersRouter.get("/:id/id-card/:side", idCardDownloadHandler);
customersRouter.delete("/:id/id-card/:side", idCardRemoveHandler);

