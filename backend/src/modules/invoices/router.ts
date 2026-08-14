import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.js";
import { requireRole } from "@/middleware/require-role.js";
import {
  generateInvoiceHandler,
  listInvoicesHandler,
  getInvoiceHandler,
  markPaidHandler,
  voidInvoiceHandler,
} from "./controller.js";

export const invoicesRouter = Router();

invoicesRouter.use(authenticate, requireRole("owner"));

invoicesRouter.post("/", generateInvoiceHandler);
invoicesRouter.get("/", listInvoicesHandler);
invoicesRouter.get("/:id", getInvoiceHandler);
invoicesRouter.post("/:id/pay", markPaidHandler);
invoicesRouter.post("/:id/void", voidInvoiceHandler);
