import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.js";
import { requireRole } from "@/middleware/require-role.js";
import { searchAddressesHandler, resolveAddressHandler } from "./controller.js";

export const addressesRouter = Router();

// Owner-only, so the configured provider key cannot be spent through this
// system by anyone else.
addressesRouter.use(authenticate, requireRole("owner"));

addressesRouter.get("/search", searchAddressesHandler);
addressesRouter.get("/:placeId", resolveAddressHandler);
