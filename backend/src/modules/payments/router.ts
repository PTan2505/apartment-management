import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.js";
import { requireRole } from "@/middleware/require-role.js";
import { getPaymentHandler, reversePaymentHandler } from "./controller.js";
import { reconcilePaymentHandler } from "@/modules/payment-gateway/controller.js";

/**
 * A payment stands on its own, so it is addressed on its own. Listing the
 * payments of one invoice hangs off the invoices router instead, beside the
 * invoice's other operations; the handler still lives in this module.
 */
export const paymentsRouter = Router();

paymentsRouter.use(authenticate, requireRole("owner"));

paymentsRouter.get("/:id", getPaymentHandler);
paymentsRouter.post("/:id/reverse", reversePaymentHandler);
// Ask the gateway what IT thinks, and report a disagreement rather than
// resolving it. Handler lives in the payment-gateway module.
paymentsRouter.post("/:id/reconcile", reconcilePaymentHandler);
