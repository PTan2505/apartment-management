import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.js";
import { accountGuard, requireParamInScope } from "@/middleware/staff-scope.js";
import { paymentBuildingId } from "@/lib/scope-lookup.js";
import { RESOURCE } from "@/lib/parse-id.js";
import { requireRole } from "@/middleware/require-role.js";
import { getPaymentHandler, reversePaymentHandler } from "./controller.js";
import { reconcilePaymentHandler } from "@/modules/payment-gateway/controller.js";

/**
 * A payment stands on its own, so it is addressed on its own. Listing the
 * payments of one invoice hangs off the invoices router instead, beside the
 * invoice's other operations; the handler still lives in this module.
 */
export const paymentsRouter = Router();

paymentsRouter.use(authenticate, accountGuard, requireRole("owner", "manager"));

paymentsRouter.param("id", requireParamInScope(RESOURCE.payment, paymentBuildingId));

paymentsRouter.get("/:id", getPaymentHandler);
// Undoing a recorded payment, for the same reason recording one is the
// owner's: both decide whether an amount counts as received.
paymentsRouter.post("/:id/reverse", requireRole("owner"), reversePaymentHandler);
// Ask the gateway what IT thinks, and report a disagreement rather than
// resolving it. Handler lives in the payment-gateway module.
paymentsRouter.post("/:id/reconcile", reconcilePaymentHandler);
