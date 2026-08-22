import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.js";
import { requireRole } from "@/middleware/require-role.js";
import {
  generateInvoiceHandler,
  issueAdhocInvoiceHandler,
  listInvoicesHandler,
  getInvoiceHandler,
  markPaidHandler,
  voidInvoiceHandler,
} from "./controller.js";

export const invoicesRouter = Router();

invoicesRouter.use(authenticate, requireRole("owner"));

invoicesRouter.post("/", generateInvoiceHandler);
// Charges the owner decides rather than calculates. Its own route because it is
// its own operation — which is what settles the invoice's kind.
invoicesRouter.post("/adhoc", issueAdhocInvoiceHandler);
invoicesRouter.get("/", listInvoicesHandler);
invoicesRouter.get("/:id", getInvoiceHandler);
invoicesRouter.post("/:id/pay", markPaidHandler);
invoicesRouter.post("/:id/void", voidInvoiceHandler);
