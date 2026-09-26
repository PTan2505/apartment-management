import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.js";
import { accountGuard } from "@/middleware/staff-scope.js";
import { requireRole } from "@/middleware/require-role.js";
import { listHeldDepositsHandler } from "./controller.js";

/**
 * What is currently held, across leases.
 *
 * The lease-scoped deposit operations — the settlement figures, the return, an
 * adjustment — hang off the leases router instead, because they act on one
 * tenancy and belong beside its other operations. Their handlers still live in
 * this module; only the mounting differs.
 */
export const depositsRouter = Router();

/*
  The deposits HELD, across the whole business — a balance, not an operation.
  A manager settles the deposit of a tenancy they are closing, which lives on
  the lease; what the business is holding altogether is the owner's figure.
*/
depositsRouter.use(authenticate, accountGuard, requireRole("owner"));

depositsRouter.get("/", listHeldDepositsHandler);
