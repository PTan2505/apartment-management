import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.js";
import { accountGuard, requireParamInScope } from "@/middleware/staff-scope.js";
import { invoiceBuildingId } from "@/lib/scope-lookup.js";
import { RESOURCE } from "@/lib/parse-id.js";
import { requireRole } from "@/middleware/require-role.js";
import { listInvoicePaymentsHandler } from "@/modules/payments/controller.js";
import {
  generateInvoiceHandler,
  issueAdhocInvoiceHandler,
  listInvoicesHandler,
  listDueHandler,
  getInvoiceHandler,
  markPaidHandler,
  voidInvoiceHandler,
} from "./controller.js";

export const invoicesRouter = Router();

invoicesRouter.use(authenticate, accountGuard, requireRole("owner", "manager"));

// An invoice reaches its building through its tenancy's room; staff of another
// building find it absent.
invoicesRouter.param("id", requireParamInScope(RESOURCE.invoice, invoiceBuildingId));

invoicesRouter.post("/", generateInvoiceHandler);
// Charges the owner decides rather than calculates. Its own route because it is
// its own operation — which is what settles the invoice's kind.
invoicesRouter.post("/adhoc", issueAdhocInvoiceHandler);
invoicesRouter.get("/", listInvoicesHandler);
// What is still to be billed for a month. Registered before "/:id" so the
// literal path is not swallowed by the id route.
invoicesRouter.get("/due", listDueHandler);
invoicesRouter.get("/:id", getInvoiceHandler);
/*
  Declaring money settled, or unsettling it, is the owner's.

  A manager issues invoices and chases them; saying one has been paid is
  asserting that money arrived, and withdrawing one is asserting that a debt
  never existed. Both move the figures the revenue report adds up, which a
  manager cannot read.

  Money arriving through a tenancy's payment link is untouched by this: nobody
  declares it, the gateway reports it.
*/
invoicesRouter.post("/:id/pay", requireRole("owner"), markPaidHandler);
invoicesRouter.post("/:id/void", requireRole("owner"), voidInvoiceHandler);
// What settled this invoice, and when. Handler lives in the payments module.
invoicesRouter.get("/:id/payments", listInvoicePaymentsHandler);
