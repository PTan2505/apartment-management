import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.js";
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

depositsRouter.use(authenticate, requireRole("owner"));

depositsRouter.get("/", listHeldDepositsHandler);
